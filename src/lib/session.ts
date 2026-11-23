import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { cache } from "react";

export const getCurrentUser = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.user.findUnique({
    where: { id: session.user.id },
    include: { preferences: true },
  });
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("You need to be signed in.");
  }
  return user;
}
