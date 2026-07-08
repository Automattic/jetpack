# Jetpack Performance Testing

Measures Jetpack admin-page performance (LCP, TTFB, FCP, and runtime bundle size) with a simulated WordPress.com connection, and posts the results to CodeVitals to track them over time.

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

## Metrics

Each scenario posts its metrics in a single CodeVitals call per run (one per `metrics` entry in `scenarios.js`). Each metric reads its value from `summary.<field>.median` and is range-checked against its `type` in `SANITY_RANGES` before posting.

### `jetpackConnected` — wp-admin Dashboard (simulated connection)

| CodeVitals key                                             | Field  | Type   | Description                                     |
| ---------------------------------------------------------- | ------ | ------ | ----------------------------------------------- |
| `wp-admin-dashboard-connection-sim-largestContentfulPaint` | `lcp`  | `lcp`  | Dashboard LCP with simulated Jetpack connection |
| `wp-admin-dashboard-connection-sim-timeToFirstByte`        | `ttfb` | `ttfb` | Dashboard TTFB (navigation `responseStart`)     |
| `wp-admin-dashboard-connection-sim-firstContentfulPaint`   | `fcp`  | `fcp`  | Dashboard FCP (first-contentful-paint)          |

### `formsResponses` — Forms responses wp-build dashboard (simulated connection)

`admin.php?page=jetpack-forms-responses-wp-admin&p=%2Fresponses%2Finbox`, measured on the same simulated-connection instance as the Dashboard. The `p` route is pinned to the responses inbox: a bare page URL server-redirects to the default tab (`/forms`, the forms list, under Central Form Management), so the scenario asserts the final URL to avoid measuring the wrong page.

| CodeVitals key                                          | Field            | Type             | Description                                               |
| ------------------------------------------------------- | ---------------- | ---------------- | --------------------------------------------------------- |
| `forms-responses-connection-sim-largestContentfulPaint` | `lcp`            | `lcp`            | Forms responses LCP                                       |
| `forms-responses-connection-sim-timeToFirstByte`        | `ttfb`           | `ttfb`           | Forms responses TTFB                                      |
| `forms-responses-connection-sim-firstContentfulPaint`   | `fcp`            | `fcp`            | Forms responses FCP                                       |
| `forms-responses-connection-sim-decodedBytesKB`         | `decodedBytesKB` | `decodedBytesKB` | Bundle size: summed per-resource `decodedBodySize`, in KB |

#### Bundle size (`decodedBytesKB`) — what it measures, and why not build output

`decodedBytesKB` is the sum of every resource's `decodedBodySize` on the measured page, in KB — the page's **runtime payload** (the JavaScript and CSS the browser actually downloads), aggregated in `measure-lcp.js`.

- **Decoded bytes, not transfer size.** The measured load is a warm-cache `page.reload()`, where cached resources report `transferSize: 0`; and the Docker WordPress serves uncompressed, so `transferSize` would neither survive caching nor match production's gzipped bytes. `decodedBodySize` is cache- and compression-independent, so it stays stable however assets are served. It maps to the decoded (uncompressed) byte count, not the gzipped wire size — fine for a trend.
- **Runtime payload, not build output.** The regression this watches is the wp-build `boot` shell statically pulling core `@wordpress/editor` into pages that never open an editor. Those are externalized `@wordpress/*` core modules, resolved through the wp-build import map as separate static files, not the plugin's own bundle, so a check against the built plugin's own file sizes wouldn't move when they are lazy-loaded. Summing the resources the page actually downloads does, so the line falls when the fix lands and flags the next silent jump.
- **On the Forms responses page specifically.** It's a shipped wp-build dashboard that loads the boot shell's editor payload; the wp-admin Dashboard does not, so the bundle-size metric is posted only for `formsResponses`.
- **Detects a jump, doesn't attribute it.** The value sums every resource on the page, not the editor payload alone (that payload is roughly 1.3 MB of the ~8.2 MB total, about 16%). The other ~84% is ordinary page weight, so on this actively-developed dashboard most trend moves will be routine Forms feature work rather than the editor payload the metric is meant to catch. A move flags that page weight changed; confirming the cause means reading the per-resource breakdown in the saved `results.json`, not the dashboard line.

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

`post-to-codevitals.js` checks every typed metric against `SANITY_RANGES` in `scenarios.js` before posting. A value outside its range is logged and rejected, and the script exits non-zero so CI surfaces the failure. Live posting is all-or-nothing per run: any sanity failure suppresses the entire POST, so nothing lands and retrying the red build posts the full set exactly once. (That guarantee covers the validation-failure retry only — re-running a green build appends duplicate points unless opt-in cross-commit dedup is enabled.) A dry run still prints the surviving metrics, if any, for diagnostics.

| Metric           | Min  | Max   | Unit |
| ---------------- | ---- | ----- | ---- |
| `lcp`            | 100  | 60000 | ms   |
| `ttfb`           | 10   | 10000 | ms   |
| `fcp`            | 50   | 30000 | ms   |
| `tbt`            | 0    | 10000 | ms   |
| `cls`            | 0    | 5     | —    |
| `decodedBytesKB` | 1000 | 51200 | KB   |

Add a row when a new metric type starts being posted, and set the `type` on the metric so the check applies to it — either `type` on a `metrics[]` entry (the multi-metric shape) or the scenario-level `metricType` (the legacy single-key shape). A keyed metric with no type is refused (never posted unchecked).

### Staging keys

Post a new metric to a `-staging` CodeVitals key first (e.g. `…-timeToFirstByte-staging`) for 2-3 builds. Inspect the values in the CodeVitals UI, then rename to the production key. This gives a safety window before a new metric reaches production.

**Waiving the staging window (owner decision).** A scenario may post straight to production keys when the build owner accepts the risk, as the `formsResponses` metrics do. The waiver is not automatic — it requires all of: the `SANITY_RANGES` row + the all-or-nothing gate as the substitute guardrail, manual sign-off before the first live post, and the PR that introduces the keys listing them and naming the waiver so the impact is visible in review. A dry run's `stdDev: 0` shows repeatability, not correctness, so it is not the safeguard. The per-scenario comment in `scenarios.js` records where a waiver is in effect.

### Capture guards for targeted-page scenarios

A scenario that measures a specific admin page (a `path` + `waitForSelector`, like `formsResponses`) can declare two optional guards so a mis-captured page never reaches its permanent keys. Both fail the iteration closed — a failed capture posts nothing rather than a wrong number.

- **`expectUrlIncludes`** — a substring the page's final URL must contain after every redirect settles. It defends the concrete redirect threat: `class-dashboard.php` sends a bare page URL to the forms LIST, which strips the pinned `p=/responses/inbox`, so the guard fires. It does not prove the SPA client-rendered the target route — a client-side divergence that keeps the URL would pass. That is deliberate: a guessed DOM-selector assertion would throw on every iteration if the markup shifts, blackholing the whole series on the append-only store, so the URL check is the safer defense for the redirect it targets.
- **`minResourceCount`** — an iteration whose capture returns fewer resources than a healthy load (40 for `formsResponses`, against a real ~80) is dropped from the sample; if every iteration falls short the run posts nothing. This is a **count** floor, not an "editor asset is present" check: the bundle-size metric is meant to fall when the editor lazy-loads, which removes a few large files rather than the bulk of the count, so a count floor catches a truncated capture without clipping the legitimate improvement.

### If bad data lands anyway

A bad point must be corrected by the CodeVitals admin. Steps:

1. **Stop posting.** Pause the CodeVitals Jetpack Performance Scheduler build in TeamCity.
2. **Document the extent.** Record the affected metric keys, the commit range (monorepo hashes), the time window (build start to end), and whether the values are isolated or systematic.
3. **Request a correction.** CodeVitals runs outside this project; send the request through the team channel named in the FORMS-696 runbook. Include metric ID 113, the affected keys, the commit/timestamp range, and the root cause.
4. **Fix the root cause.** Add or tighten a sanity range or staging gate. Don't re-enable the Scheduler until the fix merges.
5. **Record the incident.** Add the failure mode, detection timing, and prevention measures to the FORMS-696 maintenance runbook.
