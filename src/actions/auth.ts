"use server";

import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { z } from "zod";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/db";
import { resetEmailHtml, sendTransactionalEmail, verificationEmailHtml } from "@/lib/email";

const signupSchema = z.object({
  name: z.string().min(2).max(48),
  email: z.string().email(),
  password: z.string().min(8).max(72),
});

function appUrl() {
  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  return process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? (vercelHost ? `https://${vercelHost}` : "http://localhost:3000");
}

export async function signUpAction(_prev: { error?: string } | undefined, formData: FormData) {
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "Check your name, email, and password (8+ characters)." };
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "An account with that email already exists." };

  const usernameBase = email.split("@")[0].replace(/[^a-z0-9]/gi, "").slice(0, 16) || "viewer";
  const username = `${usernameBase}${Math.floor(Math.random() * 900 + 100)}`;
  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      name: parsed.data.name,
      username,
      passwordHash,
      preferences: { create: {} },
    },
  });

  const token = randomBytes(32).toString("hex");
  await prisma.verificationToken.create({
    data: {
      identifier: `verify:${email}`,
      token,
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
    },
  });
  await sendTransactionalEmail(email, "Verify your ReelTrack email", verificationEmailHtml(`${appUrl()}/verify-email?token=${token}&email=${encodeURIComponent(email)}`));

  try {
    await signIn("credentials", {
      email,
      password: parsed.data.password,
      redirectTo: "/onboarding",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Account created, but we couldn't sign you in automatically." };
    }
    throw error;
  }

  return { error: undefined, userId: user.id };
}

export async function loginAction(_prev: { error?: string } | undefined, formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const callbackUrl = String(formData.get("callbackUrl") ?? "/home");
  try {
    await signIn("credentials", { email, password, redirectTo: callbackUrl });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Those credentials don't match an account." };
    }
    throw error;
  }
}

export async function googleSignIn(callbackUrl = "/home") {
  await signIn("google", { redirectTo: callbackUrl });
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}

export async function requestPasswordReset(emailRaw: string) {
  const email = emailRaw.toLowerCase().trim();
  const parsed = z.string().email().safeParse(email);
  if (!parsed.success) return { error: "Enter a valid email." };
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { ok: true };
  const token = randomBytes(32).toString("hex");
  await prisma.verificationToken.create({
    data: {
      identifier: `reset:${email}`,
      token,
      expires: new Date(Date.now() + 1000 * 60 * 30),
    },
  });
  await sendTransactionalEmail(email, "Reset your ReelTrack password", resetEmailHtml(`${appUrl()}/reset-password?token=${token}&email=${encodeURIComponent(email)}`));
  return { ok: true };
}

export async function resetPassword(token: string, email: string, password: string) {
  if (password.length < 8) return { error: "Use at least 8 characters." };
  const record = await prisma.verificationToken.findUnique({
    where: { identifier_token: { identifier: `reset:${email.toLowerCase()}`, token } },
  });
  if (!record || record.expires < new Date()) return { error: "That reset link is no longer valid." };
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.update({ where: { email: email.toLowerCase() }, data: { passwordHash } });
  await prisma.verificationToken.delete({
    where: { identifier_token: { identifier: record.identifier, token } },
  });
  return { ok: true };
}

export async function verifyEmail(token: string, email: string) {
  const record = await prisma.verificationToken.findUnique({
    where: { identifier_token: { identifier: `verify:${email.toLowerCase()}`, token } },
  });
  if (!record || record.expires < new Date()) return { error: "That verification link is no longer valid." };
  await prisma.user.update({
    where: { email: email.toLowerCase() },
    data: { emailVerified: new Date() },
  });
  await prisma.verificationToken.delete({
    where: { identifier_token: { identifier: record.identifier, token } },
  });
  return { ok: true };
}
