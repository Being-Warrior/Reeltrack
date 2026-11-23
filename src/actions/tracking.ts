"use server";

import { revalidatePath } from "next/cache";
import { PreferenceSource, RecommendationEventType, WatchStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { boostTitleGenres, refreshSignalsForStatus } from "@/lib/taste";
import { recordRecommendationEvent, recordRecommendationEventForTitle, refreshRecommendationsAfterSelection } from "@/lib/recommendations";

function touchPaths(titleId: string) {
  revalidatePath("/home");
  revalidatePath("/watchlist");
  revalidatePath("/watched");
  revalidatePath("/discover");
  revalidatePath(`/title/${titleId}`);
}

export async function setWatchStatus(titleId: string, status: WatchStatus | null) {
  const user = await requireUser();
  z.string().uuid().parse(titleId);

  if (status === null) {
    await prisma.userTitleStatus.deleteMany({ where: { userId: user.id, titleId } });
    touchPaths(titleId);
    return { ok: true, promptRating: false };
  }

  const existing = await prisma.userTitleStatus.findUnique({
    where: { userId_titleId: { userId: user.id, titleId } },
  });

  await prisma.userTitleStatus.upsert({
    where: { userId_titleId: { userId: user.id, titleId } },
    update: {
      status,
      startedAt: status === WatchStatus.WATCHING ? existing?.startedAt ?? new Date() : existing?.startedAt,
      completedAt: status === WatchStatus.COMPLETED ? new Date() : null,
    },
    create: {
      userId: user.id,
      titleId,
      status,
      startedAt: status === WatchStatus.WATCHING || status === WatchStatus.COMPLETED ? new Date() : null,
      completedAt: status === WatchStatus.COMPLETED ? new Date() : null,
    },
  });

  await refreshSignalsForStatus(user.id, titleId, status);
  if (status === WatchStatus.WATCHLIST) {
    await recordRecommendationEventForTitle(user.id, titleId, RecommendationEventType.WATCHLIST);
  }
  if (status === WatchStatus.COMPLETED) {
    await recordRecommendationEventForTitle(user.id, titleId, RecommendationEventType.WATCHED);
  }
  if (status === WatchStatus.COMPLETED) await refreshRecommendationsAfterSelection(user.id);
  touchPaths(titleId);

  if (status === WatchStatus.COMPLETED) {
    const rating = await prisma.rating.findUnique({
      where: { userId_titleId: { userId: user.id, titleId } },
    });
    return { ok: true, promptRating: !rating };
  }
  return { ok: true, promptRating: false };
}

export async function setRating(titleId: string, rating: number) {
  const user = await requireUser();
  z.string().uuid().parse(titleId);
  const value = z.number().min(0.5).max(5).parse(rating);
  const stepped = Math.round(value * 2) / 2;

  await prisma.rating.upsert({
    where: { userId_titleId: { userId: user.id, titleId } },
    update: { rating: stepped },
    create: { userId: user.id, titleId, rating: stepped },
  });
  await boostTitleGenres(user.id, titleId, PreferenceSource.RATING, stepped / 5);
  touchPaths(titleId);
  return { ok: true };
}

export async function toggleFavorite(titleId: string) {
  const user = await requireUser();
  z.string().uuid().parse(titleId);
  const existing = await prisma.favorite.findUnique({
    where: { userId_titleId: { userId: user.id, titleId } },
  });
  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
  } else {
    const now = new Date();
    await prisma.$transaction([
      prisma.favorite.create({ data: { userId: user.id, titleId } }),
      prisma.userTitleStatus.upsert({
        where: { userId_titleId: { userId: user.id, titleId } },
        update: { status: WatchStatus.COMPLETED, completedAt: now },
        create: {
          userId: user.id,
          titleId,
          status: WatchStatus.COMPLETED,
          startedAt: now,
          completedAt: now,
        },
      }),
    ]);
    await boostTitleGenres(user.id, titleId, PreferenceSource.FAVORITE, 0.35);
    await refreshSignalsForStatus(user.id, titleId, WatchStatus.COMPLETED);
    await recordRecommendationEventForTitle(user.id, titleId, RecommendationEventType.WATCHED);
  }
  if (!existing) await refreshRecommendationsAfterSelection(user.id);
  touchPaths(titleId);
  return { favorite: !existing };
}

export async function dismissRecommendation(recommendationId: string) {
  const user = await requireUser();
  await recordRecommendationEvent(user.id, recommendationId, RecommendationEventType.DISMISSED);
  revalidatePath("/home");
  revalidatePath("/discover");
}

export async function toggleEpisodeWatched(episodeId: string) {
  const user = await requireUser();
  z.string().uuid().parse(episodeId);
  const [episode, existing] = await Promise.all([
    prisma.episode.findUnique({ where: { id: episodeId }, select: { season: { select: { titleId: true } } } }),
    prisma.episodeProgress.findUnique({ where: { userId_episodeId: { userId: user.id, episodeId } } }),
  ]);
  if (!episode) throw new Error("Episode not found.");
  if (existing) {
    await prisma.episodeProgress.delete({ where: { id: existing.id } });
  } else {
    await prisma.episodeProgress.create({ data: { userId: user.id, episodeId } });
  }
  revalidatePath(`/title/${episode.season.titleId}`);
  revalidatePath("/watchlist");
  return { watched: !existing };
}
