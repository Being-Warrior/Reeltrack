CREATE TYPE "UpcomingReleaseKind" AS ENUM ('MOVIE', 'SEASON', 'EPISODE');

CREATE TABLE "upcoming_releases" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "source_title_id" TEXT NOT NULL,
    "related_title_id" TEXT,
    "kind" "UpcomingReleaseKind" NOT NULL,
    "external_key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "release_date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "upcoming_releases_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "upcoming_releases_user_id_external_key_key" ON "upcoming_releases"("user_id", "external_key");
CREATE INDEX "upcoming_releases_user_id_release_date_idx" ON "upcoming_releases"("user_id", "release_date");

ALTER TABLE "upcoming_releases" ADD CONSTRAINT "upcoming_releases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "upcoming_releases" ADD CONSTRAINT "upcoming_releases_source_title_id_fkey" FOREIGN KEY ("source_title_id") REFERENCES "titles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "upcoming_releases" ADD CONSTRAINT "upcoming_releases_related_title_id_fkey" FOREIGN KEY ("related_title_id") REFERENCES "titles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
