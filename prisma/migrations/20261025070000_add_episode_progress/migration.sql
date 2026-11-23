CREATE TABLE "episode_progress" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "episode_id" TEXT NOT NULL,
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "episode_progress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "episode_progress_user_id_episode_id_key" ON "episode_progress"("user_id", "episode_id");
CREATE INDEX "episode_progress_user_id_idx" ON "episode_progress"("user_id");
CREATE INDEX "episode_progress_episode_id_idx" ON "episode_progress"("episode_id");
ALTER TABLE "episode_progress" ADD CONSTRAINT "episode_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "episode_progress" ADD CONSTRAINT "episode_progress_episode_id_fkey" FOREIGN KEY ("episode_id") REFERENCES "episodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
