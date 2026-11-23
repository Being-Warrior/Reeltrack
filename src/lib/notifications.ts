import { prisma } from "@/lib/db";

export async function syncReleaseNotifications() {
  const now = new Date();
  const inThreeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const releases = await prisma.upcomingRelease.findMany({
    where: { releaseDate: { gte: now, lte: inThreeDays }, user: { preferences: { releaseReminders: true } } },
    include: { sourceTitle: true },
  });
  await Promise.all(releases.map((release) =>
    prisma.notification.upsert({
      where: { userId_externalKey: { userId: release.userId, externalKey: `release:${release.externalKey}` } },
      update: {},
      create: {
        userId: release.userId,
        externalKey: `release:${release.externalKey}`,
        title: `${release.title} is nearly here`,
        body: release.subtitle ?? `A release related to ${release.sourceTitle.title} is due soon.`,
        href: release.relatedTitleId ? `/title/${release.relatedTitleId}` : `/title/${release.sourceTitleId}`,
      },
    }),
  ));
  return releases.length;
}
