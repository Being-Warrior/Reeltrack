"use server";

import { revalidatePath } from "next/cache";
import { PreferenceSource, WatchStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { generateRecommendations } from "@/lib/recommendations";
import { boostTitleGenres, getTasteProfile, setGenrePreferences } from "@/lib/taste";

const onboardingSchema = z.object({
  genreIds: z.array(z.string().uuid()).min(1).max(12),
  favoriteIds: z.array(z.string().uuid()).min(1).max(12),
  ratings: z.array(z.object({ titleId: z.string().uuid(), rating: z.number().min(0.5).max(5) })),
});

export async function completeOnboarding(input: z.infer<typeof onboardingSchema>) {
  const user = await requireUser();
  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Pick a few genres, favourites, and ratings to continue." };
  }

  await setGenrePreferences(user.id, parsed.data.genreIds, PreferenceSource.ONBOARDING, 0.85);

  for (const titleId of parsed.data.favoriteIds) {
    await prisma.favorite.upsert({
      where: { userId_titleId: { userId: user.id, titleId } },
      update: {},
      create: { userId: user.id, titleId },
    });
    await boostTitleGenres(user.id, titleId, PreferenceSource.FAVORITE, 0.4);
  }

  for (const item of parsed.data.ratings) {
    await prisma.rating.upsert({
      where: { userId_titleId: { userId: user.id, titleId: item.titleId } },
      update: { rating: item.rating },
      create: { userId: user.id, titleId: item.titleId, rating: item.rating },
    });
    await prisma.userTitleStatus.upsert({
      where: { userId_titleId: { userId: user.id, titleId: item.titleId } },
      update: { status: WatchStatus.COMPLETED, completedAt: new Date() },
      create: {
        userId: user.id,
        titleId: item.titleId,
        status: WatchStatus.COMPLETED,
        completedAt: new Date(),
      },
    });
    await boostTitleGenres(user.id, item.titleId, PreferenceSource.RATING, item.rating / 5);
  }

  await prisma.userPreference.upsert({
    where: { userId: user.id },
    update: { onboardingCompleted: true },
    create: { userId: user.id, onboardingCompleted: true },
  });

  await generateRecommendations(user.id);
  revalidatePath("/home");
  return { ok: true, taste: await getTasteProfile(user.id) };
}
