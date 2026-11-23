"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto grid min-h-screen max-w-xl place-items-center px-6 text-center">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-gold">ReelTrack</p>
        <h1 className="mt-3 font-serif text-4xl">Something went wrong.</h1>
        <p className="mt-3 text-muted">We couldn&apos;t load this right now. Please try again.</p>
        <button onClick={reset} className="mt-6 rounded-full bg-gold px-5 py-2 text-sm text-bg">Try again</button>
      </div>
    </main>
  );
}
