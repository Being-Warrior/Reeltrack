type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();

export function enforceRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = store.get(key);
  if (!current || current.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  if (current.count >= limit) throw new Error("Please wait a moment before trying again.");
  current.count += 1;
}
