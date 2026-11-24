"use server";

import { AutoSyncDeviceType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createDevicePairingCode, linkAutoSyncSession, revokeAutoSyncDevice } from "@/lib/autosync";
import { requireUser } from "@/lib/session";

export async function createAutoSyncPairingCode(type: AutoSyncDeviceType) {
  const user = await requireUser();
  const parsedType = z.nativeEnum(AutoSyncDeviceType).parse(type);
  const result = await createDevicePairingCode(user.id, parsedType);
  revalidatePath("/autosync");
  return { code: result.code, expiresAt: result.expiresAt.toISOString() };
}

export async function createBrowserPairingCode() {
  return createAutoSyncPairingCode(AutoSyncDeviceType.BROWSER_EXTENSION);
}

export async function revokeAutoSyncDeviceAction(deviceId: string) {
  const user = await requireUser();
  z.string().uuid().parse(deviceId);
  const result = await revokeAutoSyncDevice(user.id, deviceId);
  if (!result.count) throw new Error("Device not found.");
  revalidatePath("/autosync");
  return { ok: true };
}

export async function linkAutoSyncSessionAction(sessionId: string, titleId: string) {
  const user = await requireUser();
  z.string().uuid().parse(sessionId);
  z.string().uuid().parse(titleId);
  await linkAutoSyncSession(user.id, sessionId, titleId);
  revalidatePath("/autosync");
  revalidatePath("/watched");
  revalidatePath("/watchlist");
  revalidatePath(`/title/${titleId}`);
  return { ok: true };
}
