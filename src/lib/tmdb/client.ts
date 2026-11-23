const BASE_URL = "https://api.themoviedb.org/3";
const DEFAULT_TIMEOUT_MS = 8_000;

type Query = Record<string, string | number | undefined>;

class TmdbError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "TmdbError";
  }
}

function authHeaders(): Record<string, string> {
  const token = process.env.TMDB_ACCESS_TOKEN;
  if (token) {
    return { Authorization: `Bearer ${token}`, accept: "application/json" };
  }
  return { accept: "application/json" };
}

function withKey(url: URL) {
  const key = process.env.TMDB_API_KEY;
  if (!process.env.TMDB_ACCESS_TOKEN && key) {
    url.searchParams.set("api_key", key);
  }
  return url;
}

export function isTmdbConfigured() {
  return Boolean(process.env.TMDB_ACCESS_TOKEN || process.env.TMDB_API_KEY);
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

// export async function tmdbFetch<T>(path: string, query: Query = {}, attempt = 0): Promise<T> {
//   if (!isTmdbConfigured()) {
//     throw new TmdbError("TMDB is not configured");
//   }

//   const url = withKey(new URL(`${BASE_URL}${path}`));
//   Object.entries(query).forEach(([key, value]) => {
//     if (value !== undefined) url.searchParams.set(key, String(value));
//   });

//   const response = await fetch(url, {
//     headers: authHeaders(),
//     next: { revalidate: 60 * 60 * 12 },
//   });

//   if (response.status === 429 && attempt < 4) {
//     const retryAfter = Number(response.headers.get("retry-after") ?? 1);
//     await sleep((retryAfter + attempt) * 750);
//     return tmdbFetch<T>(path, query, attempt + 1);
//   }

//   if (!response.ok) {
//     throw new TmdbError(`TMDB request failed (${response.status})`, response.status);
//   }

//   return (await response.json()) as T;
// }

export async function tmdbFetch<T>(path: string, query: Query = {}, attempt = 0, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<T> {
  if (!isTmdbConfigured()) {
    throw new TmdbError("TMDB is not configured");
  }

  const url = withKey(new URL(`${BASE_URL}${path}`));
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined) url.searchParams.set(key, String(value));
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      headers: authHeaders(),
      next: { revalidate: 60 * 60 * 12 },
      signal: controller.signal,
    });

    if (response.status === 429 && timeoutMs === DEFAULT_TIMEOUT_MS && attempt < 4) {
      const retryAfter = Number(response.headers.get("retry-after") ?? 1);
      await sleep((retryAfter + attempt) * 750);
      return tmdbFetch<T>(path, query, attempt + 1, timeoutMs);
    }

    if (!response.ok) {
      throw new TmdbError(`TMDB request failed (${response.status})`, response.status);
    }

    return (await response.json()) as T;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException)?.cause
      ? ((error as NodeJS.ErrnoException).cause as NodeJS.ErrnoException).code
      : (error as NodeJS.ErrnoException)?.code;

    const retryable = ["ECONNRESET", "ETIMEDOUT", "ECONNREFUSED", "EAI_AGAIN"].includes(
      String(code),
    );

    if (retryable && timeoutMs === DEFAULT_TIMEOUT_MS && attempt < 4) {
      await sleep((attempt + 1) * 1000);
      return tmdbFetch<T>(path, query, attempt + 1, timeoutMs);
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
export { TmdbError };
