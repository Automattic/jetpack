# Jetpack Performance Testing

Measures wp-admin dashboard LCP (Largest Contentful Paint) for Jetpack with simulated WordPress.com connection.

## CI Usage

The test suite is designed to run in TeamCity. See `TEAMCITY-SETUP.md` for detailed setup instructions.

### Build Steps

1. Clone `jetpack-production` (pre-built plugin)
2. Install dependencies (`pnpm install`)
3. Install Playwright (`pnpm exec playwright install chromium --with-deps`)
4. Calibrate CPU throttling (`pnpm calibrate`)
5. Run tests (`pnpm test`)

### Environment Variables

| Variable               | Description                                                                                                                                                                                                                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CODEVITALS_TOKEN`     | API token for posting results to CodeVitals                                                                                                                                                                                                                                           |
| `CODEVITALS_URL`       | CodeVitals API URL (default: https://codevitals.run). Use the apex host, not `www.`: the `www.` host 301-redirects the API and the redirect drops the POST body. Set an origin-only URL (scheme + host); the API path is appended, so any path prefix on this value is not preserved. |
| `COMPOSE_PROJECT_NAME` | Unique Docker project name for build isolation                                                                                                                                                                                                                                        |
| `GIT_COMMIT`           | Git commit SHA for tracking (auto-detected from plugin)                                                                                                                                                                                                                               |
| `GIT_BRANCH`           | Git branch for tracking (default: trunk)                                                                                                                                                                                                                                              |
| `ITERATIONS`           | Number of measurement iterations (default: 5)                                                                                                                                                                                                                                         |
| `WP_ADMIN_USER`        | WordPress admin username (default: admin)                                                                                                                                                                                                                                             |
| `WP_ADMIN_PASS`        | WordPress admin password (default: password)                                                                                                                                                                                                                                          |

## Metric

- `wp-admin-dashboard-connection-sim-largestContentfulPaint-v2` - Dashboard LCP with simulated Jetpack connection

## How It Works

1. **Plugin Source**: Uses pre-built plugin from [jetpack-production](https://github.com/Automattic/jetpack-production) mirror (auto-cloned for local dev)
2. **Docker Setup**: Spins up WordPress with Jetpack and a simulated WordPress.com connection (fake tokens + mocked API with 200ms latency)
3. **CPU Calibration**: Normalizes CPU speed across different machines for consistent results
4. **LCP Measurement**: Uses Playwright to log in to wp-admin and measure Largest Contentful Paint
5. **Results**: Posts metrics to CodeVitals for tracking over time

## Scripts

| Script                           | Description                                                            |
| -------------------------------- | ---------------------------------------------------------------------- |
| `pnpm test`                      | Run full test suite (auto-clones plugin if needed)                     |
| `pnpm test:quick`                | Quick test with 2 iterations                                           |
| `pnpm calibrate`                 | Run CPU throttling calibration                                         |
| `pnpm measure`                   | Run LCP measurement only                                               |
| `pnpm report`                    | Post results to CodeVitals only                                        |
| `pnpm report:dry`                | Build and print the CodeVitals payload without posting (CI smoke test) |
| `pnpm test -- --skip-codevitals` | Run tests without posting to CodeVitals                                |

## Safeguards

CodeVitals is an **append-only** store with no self-service rollback. Once a bad point lands (wrong key, out-of-range value, scale error), the trend graph stays polluted until a CodeVitals admin corrects it. The safeguards below keep bad data out.

### Dry run

`pnpm report:dry` builds the full payload, prints it, and exits without posting. It needs no `CODEVITALS_TOKEN`, so it works as a CI smoke test. Use it to inspect a payload before a real `pnpm report`.

### Sanity-range assertions

`post-to-codevitals.js` checks every typed metric against `SANITY_RANGES` in `scenarios.js` before posting. A value outside its range is logged and skipped (not posted), and the script exits non-zero so CI surfaces the failure. Other valid metrics in the same run still post.

| Metric | Min | Max   |
| ------ | --- | ----- |
| `lcp`  | 100 | 60000 |
| `ttfb` | 10  | 10000 |
| `fcp`  | 50  | 30000 |
| `tbt`  | 0   | 10000 |
| `cls`  | 0   | 5     |

Add a row when a new metric type starts being posted, and set `metricType` on the scenario so the check applies to it.

### Staging keys

Post a new metric to a `-staging` CodeVitals key first (e.g. `…-timeToFirstByte-staging`) for 2-3 builds. Inspect the values in the CodeVitals UI, then rename to the production key. This gives a safety window before a new metric reaches production.

### If bad data lands anyway

A bad point must be corrected by the CodeVitals admin. Steps:

1. **Stop posting.** Pause the CodeVitals Jetpack Performance Scheduler build in TeamCity.
2. **Document the extent.** Record the affected metric keys, the commit range (monorepo hashes), the time window (build start to end), and whether the values are isolated or systematic.
3. **Request a correction.** CodeVitals runs outside this project; send the request through the team channel named in the FORMS-696 runbook. Include metric ID 113, the affected keys, the commit/timestamp range, and the root cause.
4. **Fix the root cause.** Add or tighten a sanity range or staging gate. Don't re-enable the Scheduler until the fix merges.
5. **Record the incident.** Add the failure mode, detection timing, and prevention measures to the FORMS-696 maintenance runbook.
