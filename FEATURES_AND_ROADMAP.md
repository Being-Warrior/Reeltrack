# ReelTrack — Features and Roadmap

## Implemented features

- Account signup, login, logout, password reset, and optional Google sign-in.
- Guided onboarding for genres, favourite titles, and ratings.
- TMDB-powered search for movies, series, and people, with filters.
- Detail pages with cast, crew, seasons, episodes, ratings, favourites, and watch-status controls.
- Watchlist, Watching, Watched, Paused, and Dropped states.
- Favouriting a title automatically marks it as Watched.
- Personal collections with create, edit, reorder, add, and remove controls.
- Personalised Home recommendations:
  - Because you liked
  - For you
  - Hidden gems
- Home recommendations do not repeat across those sections.
- Suggested titles exclude anything already in Watchlist, Watching, Watched, or Favourites.
- Recommendations refresh after every 10 new watched/favourite selections or every 24 hours.
- Watch history, ratings, profile view, and viewing analytics.
- Upcoming-release sync:
  - Official TMDB collection sequels/remakes releasing within seven days are added to Watchlist.
  - Upcoming seasons and episodes for watched or favourite series appear under Watchlist.
- Streaming-provider availability on title pages, based on the country selected in Settings.
- Official YouTube trailer links on title pages when TMDB provides a trailer.
- Individual episode watched/unwatched tracking for series.
- A Coming Soon release calendar:
  - Refreshes from TMDB whenever the page is opened.
  - Uses a global pool of upcoming movies and series, without limiting country or genre.
  - Ranks up to 36 releases around watched titles, favourites, and saved genre preferences.
  - Shows full release dates.
- Daily TMDB catalog refresh at 4:00 AM (Windows Task Scheduler) that adds
  popular, trending, highly rated, currently airing, and upcoming movies and
  series to the local Discover catalog.
- In-app release reminders that can be enabled or disabled in Settings.
- Shareable collections: owners can copy an unlisted share link and signed-in
  recipients can save a private copy of the list.
- Progressive Web App basics: an installable manifest, icon, and cached
  Watchlist navigation for offline access.
- Family mode preference that keeps TMDB adult search results excluded.
- Operational safeguards: a health endpoint at /api/health, an optional
  ADMIN_EMAIL-protected dashboard, and automated test coverage via npm run test.
- Responsive mobile layout with inline search and no page-level horizontal scrolling.
- Settings for profile/preferences, privacy controls, search-history clearing, data export, and account deletion.
- PostgreSQL data storage with Prisma Studio database access.

## Configuration-dependent features

- Password-reset emails need a Resend API key and verified sender address.
- The upcoming-release sync can be run manually with:

  ```powershell
  npm run sync:upcoming
  ```

- A weekly Windows scheduled task can make this sync automatic. It has not yet been created.

## Recommended next improvements

1. Optional email or push delivery for release reminders. This needs an email
   provider or web-push service in addition to the in-app reminders.
2. Production deployment with hosted PostgreSQL, scheduled jobs, backups, and
   a custom domain.
3. Broader automated test coverage and an external error-monitoring service
   before a public release.
