# ReelTrack

Personal movie and TV discovery. ReelTrack remembers what you watch, understands what you like, and helps you discover what comes next.

## Stack

Next.js, TypeScript, Tailwind CSS, PostgreSQL, Prisma, Auth.js, TMDB.

## Setup

1. Copy environment variables:

```bash
copy .env.example .env
```

2. Set `AUTH_SECRET`, `DATABASE_URL`, and `TMDB_API_KEY` (or `TMDB_ACCESS_TOKEN`).

3. Start PostgreSQL:

```bash
docker compose up -d
```

4. Install, migrate, and ingest catalog data:

```bash
npm install
npx prisma migrate dev --name init
npm run sync:tmdb
npm run dev
```

TMDB credentials stay on the server. The app reads titles from PostgreSQL, not from TMDB on every page view.

## Deploy online

ReelTrack is ready to deploy as a personal project using GitHub, Vercel, and Neon Postgres.

1. Create a Neon database and copy its pooled PostgreSQL connection string into Vercel as `DATABASE_URL`.
2. Import the GitHub repository in Vercel. The included `vercel.json` refreshes the catalog and release reminders daily at 4:00 AM India Standard Time (22:30 UTC).
3. Add the following Vercel Production environment variables: `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL` (your `https://...vercel.app` URL), `CRON_SECRET`, and either `TMDB_API_KEY` or `TMDB_ACCESS_TOKEN`. Add the Google and Resend variables only when those integrations are configured.
4. Run `npx prisma migrate deploy` once against the Neon database, then open `/api/health` on the deployed app to verify the database connection.

Never commit `.env` or production credentials. The cron route only accepts Vercel's `Authorization: Bearer <CRON_SECRET>` request.
