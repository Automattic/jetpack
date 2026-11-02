# Premium Analytics E2E tests

Playwright tests for the Premium Analytics dashboard bundled in the Jetpack plugin, which is how production sites get it. The standalone `jetpack-premium-analytics` plugin is only for development, so its own bootstrap has no E2E coverage.

## Running locally

From this directory, run `pnpm build` to build Jetpack, Premium Analytics and the packages they render, then follow the standard flow in [`tools/e2e-commons`](../../../../../tools/e2e-commons/README.md): `config:decrypt`, `env:up`, `tunnel:up`, `test:run`.

## How the site is set up

- Jetpack runs with the `jetpack_premium_analytics_enabled` opt-in, next to the shared `tools/e2e-commons` helper plugins. The standalone plugin stays inactive: it boots the dashboard without that gate.
- `plugins/e2e-premium-analytics-helper/` fakes the Jetpack connection when it activates, keeps wp-cli out of offline mode so connection-only modules such as WordAds load, and answers the Stats requests the dashboard's proxy makes with fixtures. Every other WordPress.com request fails with `e2e_blocked`, `jetpack.wordpress.com` included, so Sync and the heartbeat fail on this site.
- The proxy caches responses for five minutes. Clear them with `wp transient delete --all` after changing a fixture.
- `setStatsFault()` makes one Stats route answer with WordPress.com's `{ error, message }` envelope, and `setNonceLife()` shortens nonces. `setSiteState()` turns both off.
- The `dashboard` fixture fails a spec on any error response or page error from Premium Analytics. A spec that expects one declares it with `dashboard.allowErrors( pattern )`, matched against `<status> <url> <error code>`.
- `setSiteState()` puts the site back on UTC unless a spec passes a `timezone`. Don't use `page.clock` to pin dates: its `Date` replacement strips the zone from `TZDate`, so the dashboard computes everything in the browser's zone.
- The mocked plans only reach the self-hosted Stats tiers. Pass `tier` (`free` or `legacy-basic`) to `setSiteState()` to force a WordPress.com one, and `rememberedPreset` to start with a date preset already remembered.
- `dashboard.historyWrites()` counts `pushState` and `replaceState` calls since the page loaded, and `dashboard.visitsWindows()` and `dashboard.statsEndpoints()` list the Stats requests in the test. `dashboard.resetTracking()` restarts all three. Call `dashboard.waitForStatsIdle()` before reading them.
