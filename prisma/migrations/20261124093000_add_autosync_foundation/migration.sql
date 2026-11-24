-- ReelTrack AutoSync v1: secure device access, event queue, and viewing history.
CREATE TYPE "IntegrationProvider" AS ENUM ('YOUTUBE_EXTENSION', 'PLEX', 'VLC_COMPANION', 'JELLYFIN', 'KODI', 'GOOGLE_TAKEOUT', 'CSV_IMPORT');
CREATE TYPE "IntegrationStatus" AS ENUM ('ACTIVE', 'PAUSED', 'DISCONNECTED', 'ERROR');
CREATE TYPE "AutoSyncDeviceType" AS ENUM ('BROWSER_EXTENSION', 'DESKTOP_COMPANION', 'WEBHOOK', 'IMPORT');
CREATE TYPE "PlaybackEventType" AS ENUM ('STARTED', 'PROGRESS', 'PAUSED', 'STOPPED', 'COMPLETED');
CREATE TYPE "PlaybackEventStatus" AS ENUM ('PENDING', 'PROCESSING', 'PROCESSED', 'NEEDS_REVIEW', 'REJECTED', 'FAILED');
CREATE TYPE "AutoSyncMediaType" AS ENUM ('MOVIE', 'TV_EPISODE', 'VIDEO', 'UNKNOWN');
CREATE TYPE "ViewingState" AS ENUM ('STARTED', 'IN_PROGRESS', 'PAUSED', 'COMPLETED', 'ABANDONED', 'REWATCHED', 'NEEDS_REVIEW');

CREATE TABLE "integrations" (
  "id" TEXT NOT NULL, "user_id" TEXT NOT NULL, "provider" "IntegrationProvider" NOT NULL,
  "display_name" TEXT NOT NULL, "status" "IntegrationStatus" NOT NULL DEFAULT 'ACTIVE',
  "permissions" JSONB, "config" JSONB, "last_synced_at" TIMESTAMP(3), "last_error" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "integrations_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "autosync_devices" (
  "id" TEXT NOT NULL, "user_id" TEXT NOT NULL, "integration_id" TEXT, "type" "AutoSyncDeviceType" NOT NULL,
  "name" TEXT NOT NULL, "token_hash" TEXT NOT NULL, "token_expires_at" TIMESTAMP(3), "last_seen_at" TIMESTAMP(3), "revoked_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "autosync_devices_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "device_pairing_codes" (
  "id" TEXT NOT NULL, "user_id" TEXT NOT NULL, "type" "AutoSyncDeviceType" NOT NULL, "code_hash" TEXT NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL, "claimed_at" TIMESTAMP(3), "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "device_pairing_codes_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "playback_events" (
  "id" TEXT NOT NULL, "event_key" TEXT NOT NULL, "user_id" TEXT NOT NULL, "integration_id" TEXT, "device_id" TEXT,
  "event_type" "PlaybackEventType" NOT NULL, "status" "PlaybackEventStatus" NOT NULL DEFAULT 'PENDING', "media_type" "AutoSyncMediaType" NOT NULL,
  "provider_content_id" TEXT, "title" TEXT, "series_title" TEXT, "season_number" INTEGER, "episode_number" INTEGER,
  "position_seconds" INTEGER, "duration_seconds" INTEGER, "source_url" TEXT, "occurred_at" TIMESTAMP(3) NOT NULL,
  "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "processed_at" TIMESTAMP(3), "error" TEXT, "payload" JSONB,
  CONSTRAINT "playback_events_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "viewing_sessions" (
  "id" TEXT NOT NULL, "user_id" TEXT NOT NULL, "integration_id" TEXT, "device_id" TEXT, "title_id" TEXT, "episode_id" TEXT,
  "media_type" "AutoSyncMediaType" NOT NULL, "source" TEXT NOT NULL, "provider_content_id" TEXT, "source_title" TEXT, "source_url" TEXT,
  "started_at" TIMESTAMP(3) NOT NULL, "ended_at" TIMESTAMP(3), "watched_seconds" INTEGER NOT NULL DEFAULT 0, "duration_seconds" INTEGER,
  "state" "ViewingState" NOT NULL DEFAULT 'STARTED', "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0, "review_reason" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "viewing_sessions_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "viewing_history" (
  "id" TEXT NOT NULL, "user_id" TEXT NOT NULL, "session_id" TEXT NOT NULL, "title_id" TEXT, "episode_id" TEXT,
  "state" "ViewingState" NOT NULL, "watched_at" TIMESTAMP(3) NOT NULL, "rewatch" INTEGER NOT NULL DEFAULT 0, "source" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "viewing_history_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "autosync_devices_token_hash_key" ON "autosync_devices"("token_hash");
CREATE INDEX "integrations_user_id_status_idx" ON "integrations"("user_id", "status");
CREATE INDEX "integrations_user_id_provider_idx" ON "integrations"("user_id", "provider");
CREATE UNIQUE INDEX "device_pairing_codes_code_hash_key" ON "device_pairing_codes"("code_hash");
CREATE INDEX "device_pairing_codes_user_id_expires_at_idx" ON "device_pairing_codes"("user_id", "expires_at");
CREATE UNIQUE INDEX "playback_events_event_key_key" ON "playback_events"("event_key");
CREATE INDEX "playback_events_status_received_at_idx" ON "playback_events"("status", "received_at");
CREATE INDEX "playback_events_user_id_occurred_at_idx" ON "playback_events"("user_id", "occurred_at");
CREATE INDEX "playback_events_provider_content_id_idx" ON "playback_events"("provider_content_id");
CREATE INDEX "viewing_sessions_user_id_started_at_idx" ON "viewing_sessions"("user_id", "started_at");
CREATE INDEX "viewing_sessions_user_id_provider_content_id_started_at_idx" ON "viewing_sessions"("user_id", "provider_content_id", "started_at");
CREATE INDEX "viewing_sessions_state_updated_at_idx" ON "viewing_sessions"("state", "updated_at");
CREATE UNIQUE INDEX "viewing_history_session_id_key" ON "viewing_history"("session_id");
CREATE INDEX "viewing_history_user_id_watched_at_idx" ON "viewing_history"("user_id", "watched_at");
CREATE INDEX "viewing_history_title_id_idx" ON "viewing_history"("title_id");
CREATE INDEX "viewing_history_episode_id_idx" ON "viewing_history"("episode_id");

ALTER TABLE "integrations" ADD CONSTRAINT "integrations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "autosync_devices" ADD CONSTRAINT "autosync_devices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "autosync_devices" ADD CONSTRAINT "autosync_devices_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "integrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "device_pairing_codes" ADD CONSTRAINT "device_pairing_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "playback_events" ADD CONSTRAINT "playback_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "playback_events" ADD CONSTRAINT "playback_events_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "integrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "playback_events" ADD CONSTRAINT "playback_events_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "autosync_devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "viewing_sessions" ADD CONSTRAINT "viewing_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "viewing_sessions" ADD CONSTRAINT "viewing_sessions_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "integrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "viewing_sessions" ADD CONSTRAINT "viewing_sessions_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "autosync_devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "viewing_sessions" ADD CONSTRAINT "viewing_sessions_title_id_fkey" FOREIGN KEY ("title_id") REFERENCES "titles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "viewing_sessions" ADD CONSTRAINT "viewing_sessions_episode_id_fkey" FOREIGN KEY ("episode_id") REFERENCES "episodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "viewing_history" ADD CONSTRAINT "viewing_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "viewing_history" ADD CONSTRAINT "viewing_history_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "viewing_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "viewing_history" ADD CONSTRAINT "viewing_history_title_id_fkey" FOREIGN KEY ("title_id") REFERENCES "titles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "viewing_history" ADD CONSTRAINT "viewing_history_episode_id_fkey" FOREIGN KEY ("episode_id") REFERENCES "episodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
