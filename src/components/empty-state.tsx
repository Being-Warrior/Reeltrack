import Link from "next/link";

export function EmptyState({
  title,
  body,
  href,
  cta,
}: {
  title: string;
  body: string;
  href?: string;
  cta?: string;
}) {
  return (
    <div className="rounded-3xl border border-line bg-paper px-8 py-16 text-center">
      <h2 className="font-serif text-3xl">{title}</h2>
      <p className="mx-auto mt-3 max-w-md text-sm text-muted">{body}</p>
      {href && cta ? (
        <Link href={href} className="mt-6 inline-flex rounded-full bg-gold px-5 py-2 text-sm text-bg">
          {cta}
        </Link>
      ) : null}
    </div>
  );
}
