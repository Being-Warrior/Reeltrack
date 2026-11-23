"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { searchCatalog } from "@/lib/search";
import type { CatalogFilters } from "@/lib/search";
import { generateRecommendations } from "@/lib/recommendations";

export async function searchAction(query: string, filters?: CatalogFilters) {
  const user = await requireUser().catch(() => null);
  const q = query.trim();
  if (q.length < 2) return { titles: [], people: [] };
  const results = await searchCatalog(q, filters);
  if (user) {
    await prisma.searchHistory.create({ data: { userId: user.id, query: q } });
  }
  return results;
}

const settingsSchema = z.object({
  name: z.string().min(2).max(48).optional(),
  username: z.string().min(3).max(24).regex(/^[a-zA-Z0-9_]+$/).optional(),
  language: z.string().min(2).max(8).optional(),
  country: z.string().min(2).max(8).optional(),
  recommendationsEnabled: z.boolean().optional(),
  privateProfile: z.boolean().optional(),
  releaseReminders: z.boolean().optional(),
  familyMode: z.boolean().optional(),
});

export async function updateSettings(input: z.infer<typeof settingsSchema>) {
  const user = await requireUser();
  const parsed = settingsSchema.parse(input);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: parsed.name,
      username: parsed.username,
    },
  });
  await prisma.userPreference.upsert({
    where: { userId: user.id },
    update: {
      language: parsed.language,
      country: parsed.country,
      recommendationsEnabled: parsed.recommendationsEnabled,
      privateProfile: parsed.privateProfile,
      releaseReminders: parsed.releaseReminders,
      familyMode: parsed.familyMode,
    },
    create: {
      userId: user.id,
      language: parsed.language ?? "en",
      country: parsed.country ?? "US",
      recommendationsEnabled: parsed.recommendationsEnabled ?? true,
      privateProfile: parsed.privateProfile ?? true,
      releaseReminders: parsed.releaseReminders ?? true,
      familyMode: parsed.familyMode ?? false,
    },
  });
  if (parsed.recommendationsEnabled === false) {
    await prisma.recommendation.deleteMany({ where: { userId: user.id } });
  } else if (parsed.recommendationsEnabled) {
    await generateRecommendations(user.id);
  }
  revalidatePath("/settings");
  revalidatePath("/profile");
  return { ok: true };
}

export async function deleteWatchHistory() {
  const user = await requireUser();
  await prisma.$transaction([
    prisma.userTitleStatus.deleteMany({ where: { userId: user.id } }),
    prisma.searchHistory.deleteMany({ where: { userId: user.id } }),
    prisma.recommendationEvent.deleteMany({ where: { userId: user.id } }),
  ]);
  revalidatePath("/watched");
  revalidatePath("/analytics");
  return { ok: true };
}

export async function deleteSearchHistory() {
  const user = await requireUser();
  await prisma.searchHistory.deleteMany({ where: { userId: user.id } });
  revalidatePath("/settings/privacy");
}

export async function exportUserData() {
  const user = await requireUser();
  const [statuses, ratings, favorites, collections, prefs] = await Promise.all([
    prisma.userTitleStatus.findMany({ where: { userId: user.id }, include: { title: true } }),
    prisma.rating.findMany({ where: { userId: user.id }, include: { title: true } }),
    prisma.favorite.findMany({ where: { userId: user.id }, include: { title: true } }),
    prisma.collection.findMany({ where: { userId: user.id }, include: { items: { include: { title: true } } } }),
    prisma.userPreference.findUnique({ where: { userId: user.id } }),
  ]);
  return {
    exportedAt: new Date().toISOString(),
    profile: { email: user.email, name: user.name, username: user.username },
    preferences: prefs,
    statuses,
    ratings,
    favorites,
    collections,
  };
}

export async function deleteAccount() {
  const user = await requireUser();
  await prisma.user.delete({ where: { id: user.id } });
}

export async function markAllNotificationsRead() {
  const user = await requireUser();
  await prisma.notification.updateMany({ where: { userId: user.id, readAt: null }, data: { readAt: new Date() } });
  revalidatePath("/notifications");
  revalidatePath("/home");
}
