# Starting ReelTrack

Use this guide whenever you start the project again. Your database data is
kept between sessions as long as you do not remove its Docker volume.

## Everyday startup

1. Start Docker Desktop and wait until it is running.
2. Open PowerShell and move to the project folder:

   ```powershell
   cd "C:\Users\Microsoft Windows\Desktop\ReelTrack"
   ```

3. Start the PostgreSQL container:

   ```powershell
   docker compose up -d
   ```

4. Start the Next.js application:

   ```powershell
   npm run dev
   ```

5. Open http://localhost:3000 in your browser.

Keep the PowerShell window running while you use the app. If it closes, repeat
steps 1–4.

## Stopping safely

1. In the terminal running `npm run dev`, press `Ctrl+C`.
2. Optionally stop the database container:

   ```powershell
   docker compose stop
   ```

Do **not** run `docker compose down -v` unless you deliberately want to erase
the local database and all saved accounts, catalog data, and watch history.


## to view database 

npm run db:studio

Then open the URL it prints—usually http://localhost:5555.

## First-time setup only

These steps are not needed every time you restart the project:

```powershell
Copy-Item .env.example .env
npm install
npx prisma migrate dev --name init
npm run sync:tmdb
```

Before the catalog sync, edit `.env` and set a real `AUTH_SECRET` plus either
`TMDB_API_KEY` or `TMDB_ACCESS_TOKEN`. Do not commit `.env`; it contains
secrets.

Run a catalog refresh manually when wanted:

```powershell
npm run sync:tmdb
```

The refresh draws from multiple TMDB movie and series lists (popular, trending,
highly rated, currently airing, and upcoming) to keep Discover supplied with a
growing catalog.

A Windows Scheduled Task named **ReelTrack Catalog Refresh** runs this refresh
daily at 4:00 AM. Keep Docker Desktop available so PostgreSQL is running when
the task starts.

The same daily task refreshes upcoming-release data and prepares in-app
reminders. View them at /notifications after starting the app.

## Completing onboarding

New accounts are directed to onboarding before the home screen. The current
flow requires all of the following:

1. Choose at least one genre.
2. Choose at least one favourite title.
3. Rate at least one selected favourite.
4. Choose **Enter ReelTrack**, then **Explore ReelTrack**.

### If you cannot move past onboarding

The favourite-title grid must contain catalog titles. If it is empty, the
onboarding flow has no skip option and cannot be completed. Check that:

1. `.env` contains a valid TMDB API key or access token.
2. PostgreSQL is running (`docker compose up -d`).
3. The catalog sync succeeds:

   ```powershell
   npm run sync:tmdb
   ```

Refresh the browser once the sync finishes. This is a current product gap:
onboarding should offer a skip/recovery path when the catalog is empty.

## Quick troubleshooting

- **Port 3000 is already in use:** stop the other `npm run dev` process, or
  use the different address printed in the terminal.
- **Database errors:** confirm Docker Desktop is running, then run
  `docker compose up -d` again.
- **Changes do not appear:** refresh the browser; Next.js normally reloads
  source changes automatically.
- **Need to inspect data:** run `npm run db:studio`, then open the address
  Prisma prints. Avoid editing production-like data unless you intend to.
- **Email links are not delivered:** without `RESEND_API_KEY`, verification
  and password-reset links are logged to the development terminal.

## Health check

From the project folder, these should pass before a release:

```powershell
npm run lint
npm run build
```

For a lightweight production-health endpoint, open:

```
http://localhost:3000/api/health
```
