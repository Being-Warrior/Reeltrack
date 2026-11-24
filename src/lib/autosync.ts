import { createHash, randomBytes } from "crypto";
import {
  AutoSyncDeviceType,
  AutoSyncMediaType,
  IntegrationProvider,
  IntegrationStatus,
  PlaybackEventStatus,
  PlaybackEventType,
  Prisma,
  TitleType,
  ViewingState,
  WatchStatus,
} from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";

const PAIRING_CODE_TTL_MS = 10 * 60 * 1000;
const DEVICE_TOKEN_TTL_MS = 365 * 24 * 60 * 60 * 1000;
const SESSION_WINDOW_MS = 12 * 60 * 60 * 1000;

const eventSchema = z.object({
  eventKey: z.string().trim().min(8).max(180),
  eventType: z.nativeEnum(PlaybackEventType),
  mediaType: z.nativeEnum(AutoSyncMediaType),
  providerContentId: z.string().trim().max(300).optional(),
  title: z.string().trim().max(500).optional(),
  seriesTitle: z.string().trim().max(500).optional(),
  seasonNumber: z.number().int().min(0).max(999).optional(),
  episodeNumber: z.number().int().min(0).max(9999).optional(),
  positionSeconds: z.number().int().min(0).max(60 * 60 * 24).optional(),
  durationSeconds: z.number().int().positive().max(60 * 60 * 24).optional(),
  sourceUrl: z.string().url().max(2_000).optional(),
  occurredAt: z.coerce.date(),
  payload: z.record(z.string(), z.unknown()).optional(),
});

export const playbackBatchSchema = z.object({ events: z.array(eventSchema).min(1).max(50) });
export type PlaybackEventInput = z.infer<typeof eventSchema>;

type MatchedMedia = { titleId?: string; episodeId?: string; confidence: number };

function hashSecret(secret: string) {
  return createHash("sha256").update(secret).digest("hex");
}

function createPairingCode() {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const bytes = randomBytes(8);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

function providerForDevice(type: AutoSyncDeviceType) {
  switch (type) {
    case AutoSyncDeviceType.BROWSER_EXTENSION:
      return { provider: IntegrationProvider.YOUTUBE_EXTENSION, displayName: "YouTube browser extension" };
    case AutoSyncDeviceType.DESKTOP_COMPANION:
      return { provider: IntegrationProvider.VLC_COMPANION, displayName: "Desktop companion" };
    case AutoSyncDeviceType.WEBHOOK:
      return { provider: IntegrationProvider.PLEX, displayName: "Media server webhook" };
    case AutoSyncDeviceType.IMPORT:
      return { provider: IntegrationProvider.CSV_IMPORT, displayName: "Imported history" };
  }
}

function getPayloadNumber(payload: Prisma.JsonValue | null, key: string) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return undefined;
  const value = payload[key];
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : undefined;
}

function getPayloadString(payload: Prisma.JsonValue | null, key: string) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return undefined;
  const value = payload[key];
  return typeof value === "string" ? value : undefined;
}

function getPayloadBoolean(payload: Prisma.JsonValue | null, key: string) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return false;
  return payload[key] === true;
}

async function markWatching(userId: string, titleId: string, startedAt: Date) {
  const existing = await prisma.userTitleStatus.findUnique({ where: { userId_titleId: { userId, titleId } } });
  if (!existing) return prisma.userTitleStatus.create({ data: { userId, titleId, status: WatchStatus.WATCHING, startedAt } });
  if (existing.status === WatchStatus.COMPLETED) return existing;
  return prisma.userTitleStatus.update({ where: { id: existing.id }, data: { status: WatchStatus.WATCHING, startedAt: existing.startedAt ?? startedAt } });
}

async function addToWatchlist(userId: string, titleId: string) {
  const existing = await prisma.userTitleStatus.findUnique({ where: { userId_titleId: { userId, titleId } } });
  if (existing) return existing;
  return prisma.userTitleStatus.create({ data: { userId, titleId, status: WatchStatus.WATCHLIST } });
}

function tmdbIdFromEvent(event: { providerContentId: string | null; payload: Prisma.JsonValue | null }) {
  const contentId = event.providerContentId?.match(/^(?:tmdb:)?(\d+)$/i)?.[1];
  return contentId ? Number(contentId) : getPayloadNumber(event.payload, "tmdbId");
}

function tmdbEpisodeIdFromEvent(event: { providerContentId: string | null; payload: Prisma.JsonValue | null }) {
  const contentId = event.providerContentId?.match(/^tmdb-episode:(\d+)$/i)?.[1];
  return contentId ? Number(contentId) : getPayloadNumber(event.payload, "tmdbEpisodeId");
}

function thresholdFor(mediaType: AutoSyncMediaType) {
  if (mediaType === AutoSyncMediaType.VIDEO) return 0.85;
  return 0.9;
}

export function isCompletedPlayback(input: Pick<PlaybackEventInput, "eventType" | "mediaType" | "positionSeconds" | "durationSeconds">) {
  if (input.eventType === PlaybackEventType.COMPLETED) return true;
  if (!input.positionSeconds || !input.durationSeconds) return false;
  return input.positionSeconds / input.durationSeconds >= thresholdFor(input.mediaType);
}

function stateForEvent(event: {
  eventType: PlaybackEventType;
  mediaType: AutoSyncMediaType;
  positionSeconds: number | null;
  durationSeconds: number | null;
}) {
  if (event.eventType === PlaybackEventType.COMPLETED || (event.positionSeconds && event.durationSeconds && event.positionSeconds / event.durationSeconds >= thresholdFor(event.mediaType))) {
    return ViewingState.COMPLETED;
  }
  if (event.eventType === PlaybackEventType.PAUSED || event.eventType === PlaybackEventType.STOPPED) return ViewingState.PAUSED;
  if ((event.positionSeconds ?? 0) > 0) return ViewingState.IN_PROGRESS;
  return ViewingState.STARTED;
}

async function matchEvent(event: {
  mediaType: AutoSyncMediaType;
  providerContentId: string | null;
  title: string | null;
  seriesTitle: string | null;
  seasonNumber: number | null;
  episodeNumber: number | null;
  payload: Prisma.JsonValue | null;
}): Promise<MatchedMedia | null> {
  // ReelTrack trailer links carry the title ID through YouTube. This is an
  // explicit user journey, so it is safe to link the video to that title.
  const linkedTitleId = getPayloadString(event.payload, "reeltrackTitleId");
  if (linkedTitleId && z.string().uuid().safeParse(linkedTitleId).success) {
    const title = await prisma.title.findUnique({ where: { id: linkedTitleId }, select: { id: true } });
    if (title) return { titleId: title.id, confidence: 1 };
  }
  const tmdbId = tmdbIdFromEvent(event);
  if (event.mediaType === AutoSyncMediaType.MOVIE) {
    const title = await prisma.title.findFirst({
      where: tmdbId
        ? { tmdbId, type: TitleType.MOVIE }
        : event.title
          ? { type: TitleType.MOVIE, title: { equals: event.title, mode: "insensitive" } }
          : undefined,
      select: { id: true },
    });
    return title ? { titleId: title.id, confidence: tmdbId ? 1 : 0.8 } : null;
  }

  if (event.mediaType !== AutoSyncMediaType.TV_EPISODE) return null;
  const episodeTmdbId = tmdbEpisodeIdFromEvent(event);
  const episode = await prisma.episode.findFirst({
    where: episodeTmdbId
      ? { tmdbId: episodeTmdbId }
      : {
          ...(event.seasonNumber !== null ? { season: { seasonNumber: event.seasonNumber } } : {}),
          ...(event.episodeNumber !== null ? { episodeNumber: event.episodeNumber } : {}),
          ...(tmdbId || event.seriesTitle
            ? {
                season: {
                  ...(event.seasonNumber !== null ? { seasonNumber: event.seasonNumber } : {}),
                  title: tmdbId
                    ? { tmdbId, type: TitleType.TV }
                    : { title: { equals: event.seriesTitle!, mode: "insensitive" }, type: TitleType.TV },
                },
              }
            : {}),
        },
    select: { id: true, season: { select: { titleId: true } } },
  });
  return episode ? { titleId: episode.season.titleId, episodeId: episode.id, confidence: episodeTmdbId || tmdbId ? 1 : 0.85 } : null;
}

export async function createDevicePairingCode(userId: string, type: AutoSyncDeviceType) {
  const code = createPairingCode();
  const expiresAt = new Date(Date.now() + PAIRING_CODE_TTL_MS);
  await prisma.devicePairingCode.deleteMany({ where: { userId, OR: [{ expiresAt: { lt: new Date() } }, { claimedAt: { not: null } }] } });
  await prisma.devicePairingCode.create({ data: { userId, type, codeHash: hashSecret(code), expiresAt } });
  return { code, expiresAt };
}

export async function claimDevicePairingCode(input: { code: string; deviceName: string; type: AutoSyncDeviceType }) {
  const codeHash = hashSecret(input.code.trim().toUpperCase());
  const pairing = await prisma.devicePairingCode.findFirst({
    where: { codeHash, type: input.type, claimedAt: null, expiresAt: { gt: new Date() } },
  });
  if (!pairing) throw new Error("That pairing code is invalid or has expired.");

  const claimed = await prisma.devicePairingCode.updateMany({
    where: { id: pairing.id, claimedAt: null, expiresAt: { gt: new Date() } },
    data: { claimedAt: new Date() },
  });
  if (!claimed.count) throw new Error("That pairing code has already been used.");

  const integrationDetails = providerForDevice(input.type);
  let integration = await prisma.integration.findFirst({
    where: { userId: pairing.userId, provider: integrationDetails.provider, status: { not: IntegrationStatus.DISCONNECTED } },
  });
  if (!integration) {
    integration = await prisma.integration.create({
      data: { userId: pairing.userId, ...integrationDetails },
    });
  }

  const token = `rtas_${randomBytes(32).toString("base64url")}`;
  const device = await prisma.autoSyncDevice.create({
    data: {
      userId: pairing.userId,
      integrationId: integration.id,
      type: input.type,
      name: input.deviceName.trim(),
      tokenHash: hashSecret(token),
      tokenExpiresAt: new Date(Date.now() + DEVICE_TOKEN_TTL_MS),
    },
  });
  return { token, device: { id: device.id, name: device.name, type: device.type } };
}

export async function authenticateAutoSyncDevice(token: string) {
  if (!token.startsWith("rtas_")) return null;
  const device = await prisma.autoSyncDevice.findUnique({
    where: { tokenHash: hashSecret(token) },
    include: { integration: true },
  });
  if (!device || device.revokedAt || (device.tokenExpiresAt && device.tokenExpiresAt < new Date())) return null;
  await prisma.autoSyncDevice.update({ where: { id: device.id }, data: { lastSeenAt: new Date() } });
  return device;
}

export async function enqueuePlaybackEvents(device: Awaited<ReturnType<typeof authenticateAutoSyncDevice>>, events: PlaybackEventInput[]) {
  if (!device) throw new Error("Device authorization is required.");
  const result = await prisma.playbackEvent.createMany({
    data: events.map((event) => ({
      eventKey: event.eventKey,
      userId: device.userId,
      integrationId: device.integrationId,
      deviceId: device.id,
      eventType: event.eventType,
      mediaType: event.mediaType,
      providerContentId: event.providerContentId,
      title: event.title,
      seriesTitle: event.seriesTitle,
      seasonNumber: event.seasonNumber,
      episodeNumber: event.episodeNumber,
      positionSeconds: event.positionSeconds,
      durationSeconds: event.durationSeconds,
      sourceUrl: event.sourceUrl,
      occurredAt: event.occurredAt,
      payload: event.payload ? (JSON.parse(JSON.stringify(event.payload)) as Prisma.InputJsonValue) : undefined,
    })),
    skipDuplicates: true,
  });
  return result.count;
}

async function processPlaybackEvent(eventId: string) {
  const claimed = await prisma.playbackEvent.updateMany({
    where: { id: eventId, status: PlaybackEventStatus.PENDING },
    data: { status: PlaybackEventStatus.PROCESSING },
  });
  if (!claimed.count) return "skipped";

  try {
    const event = await prisma.playbackEvent.findUniqueOrThrow({ where: { id: eventId }, include: { integration: true } });
    const matched = await matchEvent(event);
    const isReview = !matched;
    const state = isReview ? ViewingState.NEEDS_REVIEW : stateForEvent(event);
    const sessionSince = new Date(event.occurredAt.getTime() - SESSION_WINDOW_MS);
    const existing = await prisma.viewingSession.findFirst({
      where: {
        userId: event.userId,
        deviceId: event.deviceId ?? undefined,
        providerContentId: event.providerContentId ?? undefined,
        startedAt: { gte: sessionSince },
      },
      orderBy: { startedAt: "desc" },
    });
    const watchedSeconds = Math.max(existing?.watchedSeconds ?? 0, event.positionSeconds ?? 0);
    const durationSeconds = event.durationSeconds ?? existing?.durationSeconds ?? undefined;
    const sessionData = {
      titleId: matched?.titleId,
      episodeId: matched?.episodeId,
      mediaType: event.mediaType,
      source: event.integration?.displayName ?? "AutoSync device",
      providerContentId: event.providerContentId,
      sourceTitle: event.seriesTitle ?? event.title,
      sourceUrl: event.sourceUrl,
      startedAt: existing?.startedAt ?? event.occurredAt,
      endedAt: state === ViewingState.COMPLETED ? event.occurredAt : null,
      watchedSeconds,
      durationSeconds,
      state,
      confidence: matched?.confidence ?? 0,
      reviewReason: isReview ? "Could not safely match this activity to a ReelTrack title." : null,
    };
    const session = existing
      ? await prisma.viewingSession.update({ where: { id: existing.id }, data: sessionData })
      : await prisma.viewingSession.create({ data: { userId: event.userId, integrationId: event.integrationId, deviceId: event.deviceId, ...sessionData } });

    // A viewed trailer is associated with its title, but it must never turn the
    // film/show into "watched". Only full movie and episode sources affect
    // watch history and episode progress.
    const isTrailer = getPayloadBoolean(event.payload, "reeltrackTrailer");
    // A verified ReelTrack trailer expresses intent to watch the full title.
    if (event.mediaType === AutoSyncMediaType.VIDEO && isTrailer && matched?.titleId) {
      await addToWatchlist(event.userId, matched.titleId);
    }
    // Main films and episodes longer than ten minutes become "Watching" as soon
    // as playback begins. The Watchlist page already displays this as In progress.
    if (matched?.titleId && event.mediaType !== AutoSyncMediaType.VIDEO && (event.durationSeconds ?? 0) >= 600 && state !== ViewingState.COMPLETED) {
      await markWatching(event.userId, matched.titleId, event.occurredAt);
    }
    if (state === ViewingState.COMPLETED && matched && event.mediaType !== AutoSyncMediaType.VIDEO) {
      await prisma.viewingHistory.upsert({
        where: { sessionId: session.id },
        update: { state, watchedAt: event.occurredAt, titleId: matched.titleId, episodeId: matched.episodeId },
        create: { userId: event.userId, sessionId: session.id, titleId: matched.titleId, episodeId: matched.episodeId, state, watchedAt: event.occurredAt, source: sessionData.source },
      });
      if (matched.episodeId) {
        await prisma.episodeProgress.upsert({
          where: { userId_episodeId: { userId: event.userId, episodeId: matched.episodeId } },
          update: {},
          create: { userId: event.userId, episodeId: matched.episodeId },
        });
        await markWatching(event.userId, matched.titleId!, event.occurredAt);
      } else if (matched.titleId) {
        await prisma.userTitleStatus.upsert({
          where: { userId_titleId: { userId: event.userId, titleId: matched.titleId } },
          update: { status: WatchStatus.COMPLETED, completedAt: event.occurredAt },
          create: { userId: event.userId, titleId: matched.titleId, status: WatchStatus.COMPLETED, startedAt: event.occurredAt, completedAt: event.occurredAt },
        });
      }
    }

    await prisma.playbackEvent.update({
      where: { id: event.id },
      data: { status: isReview ? PlaybackEventStatus.NEEDS_REVIEW : PlaybackEventStatus.PROCESSED, processedAt: new Date() },
    });
    return isReview ? "review" : "processed";
  } catch (error) {
    await prisma.playbackEvent.update({
      where: { id: eventId },
      data: { status: PlaybackEventStatus.FAILED, processedAt: new Date(), error: error instanceof Error ? error.message.slice(0, 1_000) : "Unknown processing error" },
    });
    return "failed";
  }
}

export async function processPendingPlaybackEvents(limit = 25) {
  const events = await prisma.playbackEvent.findMany({
    where: { status: PlaybackEventStatus.PENDING },
    select: { id: true },
    orderBy: { receivedAt: "asc" },
    take: Math.min(Math.max(limit, 1), 100),
  });
  const outcomes = await Promise.all(events.map((event) => processPlaybackEvent(event.id)));
  return outcomes.reduce<Record<string, number>>((counts, outcome) => {
    counts[outcome] = (counts[outcome] ?? 0) + 1;
    return counts;
  }, {});
}

export async function getAutoSyncDashboard(userId: string) {
  const [integrations, devices, recentSessions, pendingReview, completed] = await Promise.all([
    prisma.integration.findMany({ where: { userId }, orderBy: { updatedAt: "desc" } }),
    prisma.autoSyncDevice.findMany({ where: { userId, revokedAt: null }, orderBy: { lastSeenAt: "desc" } }),
    prisma.viewingSession.findMany({
      where: { userId },
      include: { title: { select: { title: true } }, episode: { select: { name: true, episodeNumber: true } } },
      orderBy: { updatedAt: "desc" },
      take: 12,
    }),
    prisma.playbackEvent.count({ where: { userId, status: PlaybackEventStatus.NEEDS_REVIEW } }),
    prisma.viewingHistory.count({ where: { userId } }),
  ]);
  return { integrations, devices, recentSessions, pendingReview, completed };
}

export async function revokeAutoSyncDevice(userId: string, deviceId: string) {
  return prisma.autoSyncDevice.updateMany({ where: { id: deviceId, userId, revokedAt: null }, data: { revokedAt: new Date() } });
}

export async function getAutoSyncReviewSessions(userId: string) {
  return prisma.viewingSession.findMany({
    where: { userId, state: ViewingState.NEEDS_REVIEW },
    orderBy: { updatedAt: "desc" },
    take: 30,
    select: {
      id: true, sourceTitle: true, source: true, mediaType: true, watchedSeconds: true, durationSeconds: true, providerContentId: true,
      createdAt: true,
    },
  });
}

export async function linkAutoSyncSession(userId: string, sessionId: string, titleId: string) {
  const session = await prisma.viewingSession.findFirst({ where: { id: sessionId, userId } });
  if (!session) throw new Error("Activity not found.");
  const title = await prisma.title.findUnique({ where: { id: titleId }, select: { id: true, type: true } });
  if (!title) throw new Error("Title not found.");
  if (session.mediaType === AutoSyncMediaType.MOVIE && title.type !== TitleType.MOVIE) throw new Error("Choose a movie for this activity.");
  if (session.mediaType === AutoSyncMediaType.TV_EPISODE && title.type !== TitleType.TV) throw new Error("Choose a series for this activity.");

  const event = await prisma.playbackEvent.findFirst({
    where: { userId, deviceId: session.deviceId ?? undefined, providerContentId: session.providerContentId ?? undefined },
    orderBy: { occurredAt: "desc" },
    select: { seasonNumber: true, episodeNumber: true },
  });
  const episode = session.mediaType === AutoSyncMediaType.TV_EPISODE && event?.seasonNumber != null && event?.episodeNumber != null
    ? await prisma.episode.findFirst({ where: { episodeNumber: event.episodeNumber, season: { titleId: title.id, seasonNumber: event.seasonNumber } }, select: { id: true } })
    : null;
  const completion = session.durationSeconds && session.watchedSeconds / session.durationSeconds >= thresholdFor(session.mediaType);
  const state = completion ? ViewingState.COMPLETED : ViewingState.IN_PROGRESS;
  const updated = await prisma.viewingSession.update({
    where: { id: session.id },
    data: { titleId: title.id, episodeId: episode?.id, state, confidence: 1, reviewReason: episode || session.mediaType !== AutoSyncMediaType.TV_EPISODE ? null : "Title linked; episode is not yet in the local catalog." },
  });
  if (!completion && session.mediaType !== AutoSyncMediaType.VIDEO && (session.durationSeconds ?? 0) >= 600) {
    await markWatching(userId, title.id, session.startedAt);
  }
  if (completion && session.mediaType !== AutoSyncMediaType.VIDEO) {
    await prisma.viewingHistory.upsert({
      where: { sessionId: session.id },
      update: { state, watchedAt: new Date(), titleId: title.id, episodeId: episode?.id },
      create: { userId, sessionId: session.id, titleId: title.id, episodeId: episode?.id, state, watchedAt: new Date(), source: session.source },
    });
    if (episode) await prisma.episodeProgress.upsert({ where: { userId_episodeId: { userId, episodeId: episode.id } }, update: {}, create: { userId, episodeId: episode.id } });
    else if (session.mediaType === AutoSyncMediaType.MOVIE) await prisma.userTitleStatus.upsert({ where: { userId_titleId: { userId, titleId: title.id } }, update: { status: WatchStatus.COMPLETED, completedAt: new Date() }, create: { userId, titleId: title.id, status: WatchStatus.COMPLETED, startedAt: new Date(), completedAt: new Date() } });
  }
  return updated;
}
