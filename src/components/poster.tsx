import Image from "next/image";
import { posterUrl } from "@/lib/tmdb/images";

export function Poster({
  path,
  title,
  className = "",
  sizes = "200px",
}: {
  path: string | null;
  title: string;
  className?: string;
  sizes?: string;
}) {
  const src = posterUrl(path);
  return (
    <div className={`relative overflow-hidden bg-raised ${className}`}>
      {src ? (
        <Image src={src} alt={title} fill sizes={sizes} className="object-cover" />
      ) : (
        <div className="flex h-full items-end p-3 text-sm text-muted">{title}</div>
      )}
    </div>
  );
}
