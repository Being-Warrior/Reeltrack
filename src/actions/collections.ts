"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

const collectionSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(400).optional(),
  isPrivate: z.boolean().optional(),
});

export async function createCollection(input: z.infer<typeof collectionSchema>) {
  const user = await requireUser();
  const parsed = collectionSchema.parse(input);
  const collection = await prisma.collection.create({
    data: {
      userId: user.id,
      name: parsed.name,
      description: parsed.description,
      isPrivate: parsed.isPrivate ?? true,
    },
  });
  revalidatePath("/collections");
  return collection;
}

export async function updateCollection(id: string, input: z.infer<typeof collectionSchema>) {
  const user = await requireUser();
  const parsed = collectionSchema.parse(input);
  await prisma.collection.updateMany({
    where: { id, userId: user.id },
    data: parsed,
  });
  revalidatePath("/collections");
  revalidatePath(`/collections/${id}`);
}

export async function deleteCollection(id: string) {
  const user = await requireUser();
  await prisma.collection.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/collections");
}

export async function addTitleToCollection(collectionId: string, titleId: string) {
  const user = await requireUser();
  z.string().uuid().parse(collectionId);
  z.string().uuid().parse(titleId);
  const collection = await prisma.collection.findFirst({ where: { id: collectionId, userId: user.id } });
  if (!collection) throw new Error("Collection not found.");
  const last = await prisma.collectionItem.findFirst({
    where: { collectionId },
    orderBy: { position: "desc" },
  });
  await prisma.collectionItem.upsert({
    where: { collectionId_titleId: { collectionId, titleId } },
    update: {},
    create: {
      collectionId,
      titleId,
      position: (last?.position ?? 0) + 1,
    },
  });
  revalidatePath(`/collections/${collectionId}`);
  revalidatePath(`/title/${titleId}`);
}

export async function findTitlesForCollection(collectionId: string, query: string) {
  const user = await requireUser();
  z.string().uuid().parse(collectionId);
  const collection = await prisma.collection.findFirst({
    where: { id: collectionId, userId: user.id },
    include: { items: { select: { titleId: true } } },
  });
  if (!collection) throw new Error("Collection not found.");
  const value = query.trim();
  if (value.length < 2) return [];
  const existing = new Set(collection.items.map((item) => item.titleId));
  const titles = await prisma.title.findMany({
    where: { OR: [{ title: { contains: value, mode: "insensitive" } }, { originalTitle: { contains: value, mode: "insensitive" } }] },
    select: { id: true, title: true, type: true, releaseDate: true },
    orderBy: { popularity: "desc" },
    take: 8,
  });
  return titles.map((title) => ({ ...title, alreadyAdded: existing.has(title.id) }));
}

export async function removeTitleFromCollection(collectionId: string, titleId: string) {
  const user = await requireUser();
  const collection = await prisma.collection.findFirst({ where: { id: collectionId, userId: user.id } });
  if (!collection) throw new Error("Collection not found.");
  await prisma.collectionItem.deleteMany({ where: { collectionId, titleId } });
  revalidatePath(`/collections/${collectionId}`);
}

export async function reorderCollectionItems(collectionId: string, titleIds: string[]) {
  const user = await requireUser();
  const collection = await prisma.collection.findFirst({ where: { id: collectionId, userId: user.id } });
  if (!collection) throw new Error("Collection not found.");
  await prisma.$transaction(
    titleIds.map((titleId, index) =>
      prisma.collectionItem.update({
        where: { collectionId_titleId: { collectionId, titleId } },
        data: { position: index },
      }),
    ),
  );
  revalidatePath(`/collections/${collectionId}`);
}

export async function copySharedCollection(collectionId: string) {
  const user = await requireUser();
  const source = await prisma.collection.findFirst({
    where: { id: collectionId, isPrivate: false },
    include: { items: { orderBy: { position: "asc" } }, user: { select: { name: true, username: true } } },
  });
  if (!source) throw new Error("That shared collection is unavailable.");
  const owner = source.user.name ?? source.user.username ?? "a friend";
  const copy = await prisma.collection.create({
    data: {
      userId: user.id,
      name: `${source.name} · shared by ${owner}`.slice(0, 80),
      description: source.description,
      isPrivate: true,
      items: { create: source.items.map((item, index) => ({ titleId: item.titleId, position: index })) },
    },
  });
  revalidatePath("/collections");
  return { id: copy.id };
}
