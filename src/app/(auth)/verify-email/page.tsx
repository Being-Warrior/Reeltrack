import { verifyEmail } from "@/actions/auth";
import Link from "next/link";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>;
}) {
  const { token, email } = await searchParams;
  const result =
    token && email ? await verifyEmail(token, email) : { error: "That link is missing details." };

  return (
    <div className="grid min-h-screen place-items-center px-4 py-16">
      <div className="max-w-md rounded-3xl border border-line bg-paper p-8 text-center">
        <h1 className="font-serif text-4xl">{result.error ? "Couldn’t verify" : "Email confirmed"}</h1>
        <p className="mt-3 text-sm text-muted">
          {result.error ?? "You’re all set. Head back into your library."}
        </p>
        <Link href="/home" className="mt-6 inline-flex rounded-full bg-gold px-5 py-2 text-sm text-bg">
          Continue
        </Link>
      </div>
    </div>
  );
}
