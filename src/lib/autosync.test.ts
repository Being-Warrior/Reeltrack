import assert from "node:assert/strict";
import test from "node:test";
import { AutoSyncMediaType, PlaybackEventType } from "@prisma/client";
import { isCompletedPlayback } from "@/lib/autosync";

test("AutoSync uses the stricter 90% threshold for movies and episodes", () => {
  assert.equal(isCompletedPlayback({ eventType: PlaybackEventType.PROGRESS, mediaType: AutoSyncMediaType.MOVIE, positionSeconds: 89, durationSeconds: 100 }), false);
  assert.equal(isCompletedPlayback({ eventType: PlaybackEventType.PROGRESS, mediaType: AutoSyncMediaType.TV_EPISODE, positionSeconds: 90, durationSeconds: 100 }), true);
});

test("AutoSync uses an 85% threshold for long-form video", () => {
  assert.equal(isCompletedPlayback({ eventType: PlaybackEventType.PROGRESS, mediaType: AutoSyncMediaType.VIDEO, positionSeconds: 84, durationSeconds: 100 }), false);
  assert.equal(isCompletedPlayback({ eventType: PlaybackEventType.PROGRESS, mediaType: AutoSyncMediaType.VIDEO, positionSeconds: 85, durationSeconds: 100 }), true);
  assert.equal(isCompletedPlayback({ eventType: PlaybackEventType.COMPLETED, mediaType: AutoSyncMediaType.UNKNOWN }), true);
});
