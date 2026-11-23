"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { googleSignIn, loginAction } from "@/actions/auth";

export function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/home";
  const [state, action, pending] = useActionState(loginAction, undefined);

  return (
    <div className="mx-auto w-full max-w-md rounded-3xl border border-line bg-paper p-8">
      <h1 className="font-serif text-4xl">Welcome back</h1>
      <p className="mt-2 text-sm text-muted">Sign in to your library.</p>
      <form action={action} className="mt-8 space-y-4">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <label className="block text-sm">
          Email
          <input
            required
            name="email"
            type="email"
            className="mt-1 w-full rounded-2xl border border-line bg-bg px-4 py-3 outline-none focus:border-gold/50"
          />
        </label>
        <label className="block text-sm">
          Password
          <input
            required
            name="password"
            type="password"
            minLength={8}
            className="mt-1 w-full rounded-2xl border border-line bg-bg px-4 py-3 outline-none focus:border-gold/50"
          />
        </label>
        {state?.error ? <p className="text-sm text-terracotta">{state.error}</p> : null}
        <button
          disabled={pending}
          className="w-full rounded-full bg-gold py-3 text-sm font-medium text-bg disabled:opacity-60"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
      {googleEnabled ? (
        <form action={() => googleSignIn(callbackUrl)} className="mt-3">
          <button className="w-full rounded-full border border-line py-3 text-sm">Continue with Google</button>
        </form>
      ) : null}
      <div className="mt-6 flex justify-between text-sm text-muted">
        <Link href="/forgot-password">Forgot password</Link>
        <Link href="/signup">Create account</Link>
      </div>
    </div>
  );
}
