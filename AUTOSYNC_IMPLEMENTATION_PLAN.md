# ReelTrack AutoSync implementation plan

This plan turns the AutoSync PRD into safe, incremental releases. It does not
claim universal streaming tracking: every source must declare its actual
capability and collect only the data needed for playback tracking.

## Delivery rule

All work remains local until the current phase passes lint, TypeScript, tests,
a production build, and a migration review. Only then is it committed and
published as one cohesive release.

## Phase 1 — AutoSync foundation (implemented locally; database migration pending)

- Add integrations, devices, pairing codes, playback events, viewing sessions,
  viewing history, source metadata, processing status, and review states.
- Add a provider-independent event contract and an idempotent batch ingestion
  API for extensions and companions.
- Add a PostgreSQL-backed pending-event queue and processor. It is suitable for
  development and small beta traffic; a managed queue/worker replaces its
  scheduling layer before a public scale release.
- Match events by trusted TMDB IDs first, then series/season/episode fields;
  leave low-confidence items in review instead of marking the wrong title.
- Apply completion rules: 90% for films/episodes and 85% for ordinary videos.
- Add an AutoSync dashboard, integration directory, timeline, and review queue.
- Add device pairing endpoints for a future Chrome extension.

## Phase 2 — Chrome extension MVP (implemented locally; manual Chrome test pending)

- Create a Manifest V3 extension package.
- Support YouTube desktop first, with a site-specific adapter.
- Capture only video ID, clean title/channel metadata, playback progress,
  duration, event time, and source/device identifiers.
- Queue events locally while offline, send idempotent batches after pairing,
  show Tracking/Paused/Synced/Unsupported status, and allow site disablement.
- Do not collect passwords, raw page content, messages, payment data, or
  unrelated browsing history.

## Phase 3 — Useful non-browser sources

- Plex webhook adapter with per-integration verification secret.
- Google Takeout, CSV, and JSON import jobs with preview and approval.
- VLC localhost companion specification and filename/title review flow.
- Jellyfin integration after its supported event mechanism is verified.

## Phase 4 — Scale, reliability, and intelligence

- Move event delivery/retries to a managed queue and persistent worker.
- Encrypt OAuth/API credentials, add token revocation, delivery audit logs,
  integration health, retry policies, and observability.
- Add rewatch analytics, annual reports, source/device filters, and better
  recommendations from confirmed history.

## Explicit constraints

- A direct Netflix, Prime Video, JioHotstar, SonyLIV, ZEE5, or Apple TV+
  watch-history connection is not promised without confirmed official access
  or a policy-compliant, tested browser adapter.
- iOS, smart-TV, and arbitrary mobile-app tracking are future research, not an
  MVP claim.
- YouTube Data API enriches public metadata; it is not treated as a guaranteed
  source of private watch history.
