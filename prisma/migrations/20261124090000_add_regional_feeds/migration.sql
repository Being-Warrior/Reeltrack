-- CreateEnum
CREATE TYPE "RegionalFeedKind" AS ENUM ('POPULAR_MOVIES');

-- CreateTable
CREATE TABLE "regional_feeds" (
    "id" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "kind" "RegionalFeedKind" NOT NULL,
    "refreshed_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "regional_feeds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regional_feed_items" (
    "feed_id" TEXT NOT NULL,
    "title_id" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "source_score" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "regional_feed_items_pkey" PRIMARY KEY ("feed_id", "title_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "regional_feeds_country_kind_key" ON "regional_feeds"("country", "kind");
CREATE INDEX "regional_feeds_country_expires_at_idx" ON "regional_feeds"("country", "expires_at");
CREATE UNIQUE INDEX "regional_feed_items_feed_id_position_key" ON "regional_feed_items"("feed_id", "position");
CREATE INDEX "regional_feed_items_title_id_idx" ON "regional_feed_items"("title_id");

-- AddForeignKey
ALTER TABLE "regional_feed_items" ADD CONSTRAINT "regional_feed_items_feed_id_fkey" FOREIGN KEY ("feed_id") REFERENCES "regional_feeds"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "regional_feed_items" ADD CONSTRAINT "regional_feed_items_title_id_fkey" FOREIGN KEY ("title_id") REFERENCES "titles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
