"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { resetPassword } from "@/actions/auth";

export function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="mx-auto w-full max-w-md space-y-4 rounded-3xl border border-line bg-paper p-8"
      action={async (formData) => {
        const result = await resetPassword(
          params.get("token") ?? "",
          params.get("email") ?? "",
          String(formData.get("password")),
        );
        if (result.error) {
          setError(result.error);
          return;
        }
        router.push("/login");
      }}
    >
      <h1 className="font-serif text-4xl">Choose a new password</h1>
      <input
        required
        minLength={8}
        type="password"
        name="password"
        placeholder="New password"
        className="w-full rounded-2xl border border-line bg-bg px-4 py-3"
      />
      {error ? <p className="text-sm text-terracotta">{error}</p> : null}
      <button className="w-full rounded-full bg-gold py-3 text-sm text-bg">Update password</button>
    </form>
  );
}
