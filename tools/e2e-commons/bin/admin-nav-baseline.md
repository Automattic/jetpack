# Admin navigation baseline

`admin-nav-baseline.mjs` times how fast each Jetpack wp-build dashboard opens from the wp-admin sidebar, so the app shell (JETPACK-3393) can be compared before and after.

## What it measures

Each run opens My Jetpack in a fresh browser context, waits for the page to settle plus an idle warm-up (`--warmup`, default 8s, which gives the shell time to prewarm), then clicks each dashboard's sidebar link in turn: Settings, Forms, Newsletter, Activity Log, Backup, Podcast, Search, Social, VideoPress, Jetpack AI, and finally My Jetpack again. Pass 1 is the first visit to each page; pass 2 repeats the tour.

For every click it records:

- **headerMs**: click until a visible page `h1` that wasn't already on screen appears. A full page load and the shell's header placeholder both count.
- **interactiveMs**: click until the last DOM change before the page stays unchanged for `--quiet` ms (default 2000). This is the "time until the page stops changing" the spike (PR 53686) reported. A page still changing after `--timeout` is marked `settled: false`.
- **heapMB**: Chromium only. Used JS heap after a forced GC, after visiting `visited` dashboards.

Times come from the page's own clock (`performance.timeOrigin + performance.now()`) compared with the click time, so the same numbers work for full page loads and in-document switches.

## Running it

From `tools/e2e-commons`, after `pnpm install` and `pnpm exec playwright install chromium firefox webkit`:

```bash
pnpm exec node bin/admin-nav-baseline.mjs --site https://example.jurassic.ninja --label trunk --runs 5 --out /tmp/nav
```

The first run logs in through the site's one-time `?auto_login` link, or with `WP_PASSWORD` (and `--user`) when set, and saves the session to `<out>/<host>.state.json` for later runs. Other options: `--browsers chromium,firefox,webkit`, `--passes 2`, `--cpu-throttle 4` (Chromium only).

It writes every sample and a per-browser median table to `<out>/<label>-<time>.json`.

Load the site only from this script while measuring: other traffic, and Jurassic Ninja's rate limiting, skew the numbers.
