-- CreateEnum
CREATE TYPE "TitleType" AS ENUM ('MOVIE', 'TV');

-- CreateEnum
CREATE TYPE "WatchStatus" AS ENUM ('WATCHLIST', 'WATCHING', 'COMPLETED', 'PAUSED', 'DROPPED');

-- CreateEnum
CREATE TYPE "CreditType" AS ENUM ('CAST', 'CREW');

-- CreateEnum
CREATE TYPE "PreferenceSource" AS ENUM ('ONBOARDING', 'RATING', 'WATCH_HISTORY', 'FAVORITE', 'BEHAVIOR');

-- CreateEnum
CREATE TYPE "RecommendationEventType" AS ENUM ('IMPRESSION', 'CLICK', 'WATCHLIST', 'WATCHED', 'DISMISSED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "email_verified" TIMESTAMP(3),
    "username" TEXT,
    "display_name" TEXT,
    "avatar_url" TEXT,
    "password_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "user_preferences" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "country" TEXT NOT NULL DEFAULT 'US',
    "onboarding_completed" BOOLEAN NOT NULL DEFAULT false,
    "recommendations_enabled" BOOLEAN NOT NULL DEFAULT true,
    "private_profile" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "titles" (
    "id" TEXT NOT NULL,
    "tmdb_id" INTEGER NOT NULL,
    "type" "TitleType" NOT NULL,
    "title" TEXT NOT NULL,
    "original_title" TEXT,
    "tagline" TEXT,
    "overview" TEXT,
    "release_date" DATE,
    "runtime" INTEGER,
    "original_language" TEXT,
    "poster_path" TEXT,
    "backdrop_path" TEXT,
    "status" TEXT,
    "popularity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "vote_average" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "vote_count" INTEGER NOT NULL DEFAULT 0,
    "tmdb_last_synced_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "titles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "genres" (
    "id" TEXT NOT NULL,
    "tmdb_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "genres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "title_genres" (
    "title_id" TEXT NOT NULL,
    "genre_id" TEXT NOT NULL,

    CONSTRAINT "title_genres_pkey" PRIMARY KEY ("title_id","genre_id")
);

-- CreateTable
CREATE TABLE "keywords" (
    "id" TEXT NOT NULL,
    "tmdb_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "keywords_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "title_keywords" (
    "title_id" TEXT NOT NULL,
    "keyword_id" TEXT NOT NULL,

    CONSTRAINT "title_keywords_pkey" PRIMARY KEY ("title_id","keyword_id")
);

-- CreateTable
CREATE TABLE "people" (
    "id" TEXT NOT NULL,
    "tmdb_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "biography" TEXT,
    "profile_path" TEXT,
    "known_for_department" TEXT,
    "birthday" DATE,
    "deathday" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "people_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "title_credits" (
    "id" TEXT NOT NULL,
    "title_id" TEXT NOT NULL,
    "person_id" TEXT NOT NULL,
    "credit_type" "CreditType" NOT NULL,
    "character" TEXT,
    "job" TEXT,
    "department" TEXT,
    "cast_order" INTEGER,

    CONSTRAINT "title_credits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seasons" (
    "id" TEXT NOT NULL,
    "title_id" TEXT NOT NULL,
    "tmdb_id" INTEGER NOT NULL,
    "season_number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "overview" TEXT,
    "air_date" DATE,
    "episode_count" INTEGER NOT NULL DEFAULT 0,
    "poster_path" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "episodes" (
    "id" TEXT NOT NULL,
    "season_id" TEXT NOT NULL,
    "tmdb_id" INTEGER NOT NULL,
    "episode_number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "overview" TEXT,
    "air_date" DATE,
    "runtime" INTEGER,
    "still_path" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "episodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_title_status" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title_id" TEXT NOT NULL,
    "status" "WatchStatus" NOT NULL,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_title_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ratings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title_id" TEXT NOT NULL,
    "rating" DECIMAL(2,1) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorites" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collections" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_private" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collection_items" (
    "id" TEXT NOT NULL,
    "collection_id" TEXT NOT NULL,
    "title_id" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collection_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_genre_preferences" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "genre_id" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "source" "PreferenceSource" NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_genre_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title_id" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "algorithm_version" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendation_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "recommendation_id" TEXT NOT NULL,
    "event_type" "RecommendationEventType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recommendation_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_history" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_username_idx" ON "users"("username");

-- CreateIndex
CREATE INDEX "accounts_user_id_idx" ON "accounts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions"("session_token");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_user_id_key" ON "user_preferences"("user_id");

-- CreateIndex
CREATE INDEX "titles_tmdb_id_idx" ON "titles"("tmdb_id");

-- CreateIndex
CREATE INDEX "titles_type_idx" ON "titles"("type");

-- CreateIndex
CREATE INDEX "titles_title_idx" ON "titles"("title");

-- CreateIndex
CREATE INDEX "titles_release_date_idx" ON "titles"("release_date");

-- CreateIndex
CREATE INDEX "titles_popularity_idx" ON "titles"("popularity");

-- CreateIndex
CREATE INDEX "titles_vote_average_idx" ON "titles"("vote_average");

-- CreateIndex
CREATE UNIQUE INDEX "titles_tmdb_id_type_key" ON "titles"("tmdb_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "genres_tmdb_id_key" ON "genres"("tmdb_id");

-- CreateIndex
CREATE INDEX "title_genres_title_id_idx" ON "title_genres"("title_id");

-- CreateIndex
CREATE INDEX "title_genres_genre_id_idx" ON "title_genres"("genre_id");

-- CreateIndex
CREATE UNIQUE INDEX "keywords_tmdb_id_key" ON "keywords"("tmdb_id");

-- CreateIndex
CREATE INDEX "title_keywords_title_id_idx" ON "title_keywords"("title_id");

-- CreateIndex
CREATE INDEX "title_keywords_keyword_id_idx" ON "title_keywords"("keyword_id");

-- CreateIndex
CREATE UNIQUE INDEX "people_tmdb_id_key" ON "people"("tmdb_id");

-- CreateIndex
CREATE INDEX "people_tmdb_id_idx" ON "people"("tmdb_id");

-- CreateIndex
CREATE INDEX "people_name_idx" ON "people"("name");

-- CreateIndex
CREATE INDEX "title_credits_title_id_idx" ON "title_credits"("title_id");

-- CreateIndex
CREATE INDEX "title_credits_person_id_idx" ON "title_credits"("person_id");

-- CreateIndex
CREATE INDEX "title_credits_title_id_credit_type_idx" ON "title_credits"("title_id", "credit_type");

-- CreateIndex
CREATE INDEX "seasons_title_id_idx" ON "seasons"("title_id");

-- CreateIndex
CREATE UNIQUE INDEX "seasons_title_id_season_number_key" ON "seasons"("title_id", "season_number");

-- CreateIndex
CREATE INDEX "episodes_season_id_idx" ON "episodes"("season_id");

-- CreateIndex
CREATE UNIQUE INDEX "episodes_season_id_episode_number_key" ON "episodes"("season_id", "episode_number");

-- CreateIndex
CREATE INDEX "user_title_status_user_id_idx" ON "user_title_status"("user_id");

-- CreateIndex
CREATE INDEX "user_title_status_title_id_idx" ON "user_title_status"("title_id");

-- CreateIndex
CREATE INDEX "user_title_status_user_id_status_idx" ON "user_title_status"("user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "user_title_status_user_id_title_id_key" ON "user_title_status"("user_id", "title_id");

-- CreateIndex
CREATE INDEX "ratings_user_id_idx" ON "ratings"("user_id");

-- CreateIndex
CREATE INDEX "ratings_title_id_idx" ON "ratings"("title_id");

-- CreateIndex
CREATE UNIQUE INDEX "ratings_user_id_title_id_key" ON "ratings"("user_id", "title_id");

-- CreateIndex
CREATE INDEX "favorites_user_id_idx" ON "favorites"("user_id");

-- CreateIndex
CREATE INDEX "favorites_title_id_idx" ON "favorites"("title_id");

-- CreateIndex
CREATE UNIQUE INDEX "favorites_user_id_title_id_key" ON "favorites"("user_id", "title_id");

-- CreateIndex
CREATE INDEX "collections_user_id_idx" ON "collections"("user_id");

-- CreateIndex
CREATE INDEX "collection_items_collection_id_idx" ON "collection_items"("collection_id");

-- CreateIndex
CREATE INDEX "collection_items_title_id_idx" ON "collection_items"("title_id");

-- CreateIndex
CREATE UNIQUE INDEX "collection_items_collection_id_title_id_key" ON "collection_items"("collection_id", "title_id");

-- CreateIndex
CREATE INDEX "user_genre_preferences_user_id_idx" ON "user_genre_preferences"("user_id");

-- CreateIndex
CREATE INDEX "user_genre_preferences_genre_id_idx" ON "user_genre_preferences"("genre_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_genre_preferences_user_id_genre_id_source_key" ON "user_genre_preferences"("user_id", "genre_id", "source");

-- CreateIndex
CREATE INDEX "recommendations_user_id_idx" ON "recommendations"("user_id");

-- CreateIndex
CREATE INDEX "recommendations_user_id_expires_at_idx" ON "recommendations"("user_id", "expires_at");

-- CreateIndex
CREATE INDEX "recommendations_title_id_idx" ON "recommendations"("title_id");

-- CreateIndex
CREATE INDEX "recommendation_events_user_id_idx" ON "recommendation_events"("user_id");

-- CreateIndex
CREATE INDEX "recommendation_events_recommendation_id_idx" ON "recommendation_events"("recommendation_id");

-- CreateIndex
CREATE INDEX "search_history_user_id_idx" ON "search_history"("user_id");

-- CreateIndex
CREATE INDEX "search_history_user_id_created_at_idx" ON "search_history"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "title_genres" ADD CONSTRAINT "title_genres_title_id_fkey" FOREIGN KEY ("title_id") REFERENCES "titles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "title_genres" ADD CONSTRAINT "title_genres_genre_id_fkey" FOREIGN KEY ("genre_id") REFERENCES "genres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "title_keywords" ADD CONSTRAINT "title_keywords_title_id_fkey" FOREIGN KEY ("title_id") REFERENCES "titles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "title_keywords" ADD CONSTRAINT "title_keywords_keyword_id_fkey" FOREIGN KEY ("keyword_id") REFERENCES "keywords"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "title_credits" ADD CONSTRAINT "title_credits_title_id_fkey" FOREIGN KEY ("title_id") REFERENCES "titles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "title_credits" ADD CONSTRAINT "title_credits_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seasons" ADD CONSTRAINT "seasons_title_id_fkey" FOREIGN KEY ("title_id") REFERENCES "titles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "episodes" ADD CONSTRAINT "episodes_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_title_status" ADD CONSTRAINT "user_title_status_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_title_status" ADD CONSTRAINT "user_title_status_title_id_fkey" FOREIGN KEY ("title_id") REFERENCES "titles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_title_id_fkey" FOREIGN KEY ("title_id") REFERENCES "titles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_title_id_fkey" FOREIGN KEY ("title_id") REFERENCES "titles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collections" ADD CONSTRAINT "collections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_items" ADD CONSTRAINT "collection_items_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_items" ADD CONSTRAINT "collection_items_title_id_fkey" FOREIGN KEY ("title_id") REFERENCES "titles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_genre_preferences" ADD CONSTRAINT "user_genre_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_genre_preferences" ADD CONSTRAINT "user_genre_preferences_genre_id_fkey" FOREIGN KEY ("genre_id") REFERENCES "genres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_title_id_fkey" FOREIGN KEY ("title_id") REFERENCES "titles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendation_events" ADD CONSTRAINT "recommendation_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendation_events" ADD CONSTRAINT "recommendation_events_recommendation_id_fkey" FOREIGN KEY ("recommendation_id") REFERENCES "recommendations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_history" ADD CONSTRAINT "search_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
