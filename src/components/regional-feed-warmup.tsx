"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export function RegionalFeedWarmup({ needed }: { needed: boolean }) {
  const router = useRouter();
  const requested = useRef(false);

  useEffect(() => {
    if (!needed || requested.current) return;
    requested.current = true;
    void fetch("/api/regional-feed/refresh", { method: "POST" })
      .then((response) => response.ok && router.refresh())
      .catch(() => undefined);
  }, [needed, router]);

  return null;
}
