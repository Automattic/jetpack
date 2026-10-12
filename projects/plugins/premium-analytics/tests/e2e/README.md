# Premium Analytics E2E tests

Playwright tests for the Premium Analytics dashboard bundled in the Jetpack plugin.

## Running locally

No encrypted config and no tunnel are needed. From this directory:

```bash
pnpm build        # Jetpack, Premium Analytics and the packages they render
pnpm env:local    # E2E Docker site on localhost:8889
pnpm test:local   # all specs; pass a path to run one
```

Set `PORT_WORDPRESS` for both `env:local` and `test:local` when 8889 is taken. CI runs the standard flow in [`tools/e2e-commons`](../../../../../tools/e2e-commons/README.md) instead (`config:decrypt`, `env:up`, `tunnel:up`, `test:run`).

## How the site is set up

- Jetpack runs with the `jetpack_premium_analytics_enabled` opt-in, next to the shared `tools/e2e-commons` helper plugins (`env:local` activates the same set as `env:up`). The standalone `jetpack-premium-analytics` plugin stays inactive: it boots the dashboard without that gate.
- `plugins/e2e-premium-analytics-helper/` fakes the Jetpack connection when it activates, keeps wp-cli out of offline mode so connection-only modules such as WordAds load, and answers the Stats requests the dashboard's proxy makes with fixtures. Every other WordPress.com request fails with `e2e_blocked`.
- The proxy caches responses for five minutes. Clear them with `wp transient delete --all` after changing a fixture.
