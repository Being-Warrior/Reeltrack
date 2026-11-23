# Incomplete work

Audit date: 2026-09-13

This is an implementation-based checklist, not a product wish list.  Items are
included only where the repository contains an unfinished path, an unused
setting/model, or a missing delivery requirement.

## High priority

- [ ] **Add committed Prisma migrations.** `prisma/schema.prisma` defines the
  database, but `prisma/migrations/` does not exist. The documented setup only
  supports local development (`prisma migrate dev`); production deployments
  need versioned migrations and a deployment migration command.

- [ ] **Add automated tests and a CI check.** There are no test files, test
  dependencies, test script, or repository CI workflow. Cover authentication,
  server actions, recommendation generation, and the primary signed-in flows,
  then run lint, tests, and build in CI.

- [ ] **Schedule and operationalize TMDB synchronization.** The catalog is
  synchronized only through the manually run `npm run sync:tmdb` script.
  Configure a scheduled job, retry/error reporting, and a documented process
  for initial and ongoing catalog refreshes.

- [ ] **Respect the “Personalized recommendations” setting on read paths.**
  Turning it off deletes recommendations in `src/actions/user.ts`, but home
  and Discover still call `getActiveRecommendations`, which regenerates them
  when none exist. The preference needs to prevent both generation and display.

## Functional gaps

- [ ] **Implement episode-level watch tracking.** Seasons and episodes are
  imported and displayed, but there is no per-episode user state in the Prisma
  schema and no UI/action to mark an episode watched or resume a series from a
  specific episode.

- [ ] **Implement recommendation click feedback.** The schema supports
  recommendation events, but the UI/actions only record dismiss, watchlist,
  and watched events. Opening a recommended title does not record a click, so
  that signal is currently unused.

- [ ] **Finish or remove inactive profile preferences.** `country` and
  `privateProfile` can be saved in settings but are not read anywhere else in
  the app. Decide their intended behaviour—such as country-aware availability
  and public-profile visibility—and implement it, or remove the controls until
  those features exist.

## Deployment configuration still required

- [ ] **Configure real transactional email for production.** Without
  `RESEND_API_KEY`, verification and password-reset emails are written to the
  server log instead of being delivered. Set the provider credentials and a
  verified `EMAIL_FROM` address before launch.

## Verified current state

- `npm run lint` passes.
- No explicit `TODO` or `FIXME` markers were found in source files.
