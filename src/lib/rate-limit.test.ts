import assert from "node:assert/strict";
import test from "node:test";
import { enforceRateLimit } from "@/lib/rate-limit";

test("rate limits requests after the configured allowance", () => {
  const key = `test:${Date.now()}`;
  enforceRateLimit(key, 1, 60_000);
  assert.throws(() => enforceRateLimit(key, 1, 60_000), /Please wait/);
});
