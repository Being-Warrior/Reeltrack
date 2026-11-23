"use client";

import { useState } from "react";
import { requestPasswordReset } from "@/actions/auth";

export function ForgotPasswordForm() {
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      className="mx-auto w-full max-w-md space-y-4 rounded-3xl border border-line bg-paper p-8"
      action={async (formData) => {
        const result = await requestPasswordReset(String(formData.get("email")));
        setMessage(result.error ?? "If that email exists, a reset link is on its way.");
      }}
    >
      <h1 className="font-serif text-4xl">Reset password</h1>
      <p className="text-sm text-muted">We’ll send a short-lived link to your email.</p>
      <input
        required
        type="email"
        name="email"
        placeholder="Email"
        className="w-full rounded-2xl border border-line bg-bg px-4 py-3"
      />
      {message ? <p className="text-sm text-gold">{message}</p> : null}
      <button className="w-full rounded-full bg-gold py-3 text-sm text-bg">Send link</button>
    </form>
  );
}
