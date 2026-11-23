"use client";

import Link from "next/link";
import { useActionState } from "react";
import { googleSignIn, signUpAction } from "@/actions/auth";

export function SignupForm({ googleEnabled }: { googleEnabled: boolean }) {
  const [state, action, pending] = useActionState(signUpAction, undefined);

  return (
    <div className="mx-auto w-full max-w-md rounded-3xl border border-line bg-paper p-8">
      <h1 className="font-serif text-4xl">Create your library</h1>
      <p className="mt-2 text-sm text-muted">A few details, then we learn your taste.</p>
      <form action={action} className="mt-8 space-y-4">
        <label className="block text-sm">
          Name
          <input
            required
            name="name"
            minLength={2}
            className="mt-1 w-full rounded-2xl border border-line bg-bg px-4 py-3 outline-none focus:border-gold/50"
          />
        </label>
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
          {pending ? "Creating…" : "Create account"}
        </button>
      </form>
      {googleEnabled ? (
        <form action={() => googleSignIn("/onboarding")} className="mt-3">
          <button className="w-full rounded-full border border-line py-3 text-sm">Continue with Google</button>
        </form>
      ) : null}
      <p className="mt-6 text-sm text-muted">
        Already tracking?{" "}
        <Link href="/login" className="text-gold">
          Sign in
        </Link>
      </p>
    </div>
  );
}
