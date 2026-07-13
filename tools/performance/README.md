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
- **On the Forms responses page specifically.** It's a shipped wp-build dashboard that loads the boot shell's editor payload; the wp-admin Dashboard does not, so the bundle-size metric is posted for `formsResponses` (and, for the heavy-bundle reason below, `myJetpack`), not the Dashboard.
- **Detects a jump, doesn't attribute it.** The value sums every resource on the page, not the editor payload alone (that payload is roughly 1.3 MB of the ~8.2 MB total, about 16%). The other ~84% is ordinary page weight, so on this actively-developed dashboard most trend moves will be routine Forms feature work rather than the editor payload the metric is meant to catch. A move flags that page weight changed; confirming the cause means reading the per-resource breakdown in the saved `results.json`, not the dashboard line.

### `myJetpack` — My Jetpack admin page (simulated connection)

`admin.php?page=my-jetpack`, measured on the same simulated-connection instance as the Dashboard and Forms scenarios. My Jetpack is the heaviest Jetpack admin bundle (its own ~1.3 MB JS + CSS on top of core script handles), so it is the page where a bundle regression is most damaging — hence the `decodedBytesKB` metric is posted here too.

The page mounts a React app: PHP emits an empty `<div id="my-jetpack-container">` and `createRoot` renders `MyJetpackScreen` into it. The scenario waits for `#my-jetpack-container .jp-admin-page` (a non-hashed class from `@automattic/jetpack-components` `AdminPage`, present only after React renders) and for the container to hydrate before measuring, so LCP and the resource payload reflect the rendered page, not the empty shell.

| CodeVitals key                                     | Field            | Type             | Description                                               |
| -------------------------------------------------- | ---------------- | ---------------- | --------------------------------------------------------- |
| `my-jetpack-connection-sim-largestContentfulPaint` | `lcp`            | `lcp`            | My Jetpack LCP                                            |
| `my-jetpack-connection-sim-timeToFirstByte`        | `ttfb`           | `ttfb`           | My Jetpack TTFB                                           |
| `my-jetpack-connection-sim-firstContentfulPaint`   | `fcp`            | `fcp`            | My Jetpack FCP                                            |
| `my-jetpack-connection-sim-decodedBytesKB`         | `decodedBytesKB` | `decodedBytesKB` | Bundle size: summed per-resource `decodedBodySize`, in KB |

These four post straight to production keys under the same owner waiver as the Dashboard and Forms keys (see Safeguards → Staging keys).

#### Requires offline mode OFF (and the `wp-theme` polyfill in the mirror build)

Two conditions must hold for My Jetpack to render in the fixture:

1. **Offline mode off.** The fixture's site URL (`http://localhost:<port>`) has no dot, so `Status::is_local_site()` treats it as a local site and Jetpack enters offline mode, which makes `Initializer::should_initialize()` return false — My Jetpack never registers (no menu, no assets; the page is the generic "invalid page" admin shell). The `simulate-wpcom-connection` mu-plugin flips this with `add_filter( 'jetpack_offline_mode', '__return_false' )`. This is **install-wide** — see the attribution note below.
2. **`wp-theme` registered.** On trunk (Jetpack 16.1+), `my_jetpack_main_app` gained a `wp-theme` script dependency via the `@wordpress/*` bump (DataViews 17.x → `@wordpress/ui` ThemeProvider → `@wordpress/theme`). WordPress < 7.0 without the Gutenberg plugin does not register `wp-theme`, so WP silently drops the app script and the container stays empty (no console error). [#50291](https://github.com/Automattic/jetpack/pull/50291) fixed this in `My_Jetpack\Initializer` by registering the `WP_Build_Polyfills` shim (as Forms/Social/VideoPress already do). It merged on 2026-07-08 and is present in the `jetpack-production` mirror the fixture clones (verified against mirror commit `9ef44a8`, 2026-07-10: a clean checkout renders My Jetpack and passes every capture guard). Treat it as a baseline prerequisite: a mirror checkout that predates #50291 renders the page empty and fails the `waitForSelector`.

### Offline-mode flip — attribution note

This tooling flips `jetpack_offline_mode` off install-wide (required for My Jetpack, condition 1 above). Because one WordPress install serves every scenario, this shifts what the **existing** `wp-admin-dashboard-connection-sim-*` and `forms-responses-connection-sim-*` trends measure at the commit it lands: Jetpack runs more code paths when it is not offline. Locally measured before/after on the Dashboard scenario (the one existing scenario that measures cleanly here — see the Forms note below) was small: LCP 140→140 ms, TTFB 57→60 ms, FCP 140→140 ms, decodedBytesKB 4098→4205, resources 89→98. The timing metrics move within noise; the real signal is +9 resources / +107 KB decoded (the extra non-offline code paths). Expect a one-time baseline level shift of that order at the landing commit — every later point measures the non-offline fixture, so the trend settles at the new level rather than returning to the old one. It is a measurement-boundary change, not an ongoing regression.

The `forms-responses-*` trends could not be measured before/after locally: in the local fixture the Forms responses page's `GET /wp/v2/settings` REST request hangs server-side (>60 s, `networkidle` never settles), so every iteration times out (re-verified 2026-07-10 on mirror commit `9ef44a8`). This is a pre-existing local-fixture issue, independent of the offline flip (it hangs with offline on or off) and unrelated to this change — the Forms scenario shipped in a prior PR. Flagged here so a Forms-trend gap around this commit is not mistaken for a regression.

### Known fixture behavior on the My Jetpack page

Accepted as-is (mock realism is tracked in BOOST-456, not fixed here):

- The page's `wpcom/v2/jetpack-partners` call falls through to the mu-plugin's generic `{"success":true}` fallback and logs a `[WPCom Simulator] Unhandled endpoint (using fallback response): …/jetpack-partners` line each load. This is expected fixture noise, not an error.
- Calls scoped under `/sites/{id}/...` (stats, protect scan, videopress) are shadowed by the mock's `/sites/123456789` site-info branch (it precedes the `/stats/*` branches in the first-match chain) and receive site-info-shaped 200s — semantically wrong, so those cards render empty. Deterministic; fine for trend tracking.

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

**Waiving the staging window (owner decision).** A scenario may post straight to production keys when the build owner accepts the risk, as the `formsResponses` and `myJetpack` metrics do. The waiver is not automatic — it requires all of: the `SANITY_RANGES` row + the all-or-nothing gate as the substitute guardrail, manual sign-off before the first live post, and the PR that introduces the keys listing them and naming the waiver so the impact is visible in review. A dry run's `stdDev: 0` shows repeatability, not correctness, so it is not the safeguard. The per-scenario comment in `scenarios.js` records where a waiver is in effect.

### Capture guards for targeted-page scenarios

A scenario that measures a specific admin page (a `path` + `waitForSelector`, like `formsResponses`) can declare two optional guards so a mis-captured page never reaches its permanent keys. Both fail the iteration closed — a failed capture posts nothing rather than a wrong number.

- **`expectUrlIncludes`** — a substring the page's final URL must contain after every redirect settles. It defends the concrete redirect threat: `class-dashboard.php` sends a bare page URL to the forms LIST, which strips the pinned `p=/responses/inbox`, so the guard fires. It does not prove the SPA client-rendered the target route — a client-side divergence that keeps the URL would pass. That is deliberate: a guessed DOM-selector assertion would throw on every iteration if the markup shifts, blackholing the whole series on the append-only store, so the URL check is the safer defense for the redirect it targets.
- **`minResourceCount`** — an iteration whose capture returns fewer resources than a healthy load (40 for `formsResponses`, against a real ~80) is dropped from the sample; if every iteration falls short the run posts nothing. This is a **count** floor, not an "editor asset is present" check: the bundle-size metric is meant to fall when the editor lazy-loads, which removes a few large files rather than the bulk of the count, so a count floor catches a truncated capture without clipping the legitimate improvement.

### Per-scenario failure isolation

Every scenario in `scenarios.js` declares an `optional` flag, read by `computeRunOutcome()` in `measure-lcp.js`. The posting policy lives once, in the measure step's exit code — exit 0 means "every required scenario measured; safe to post":

| Run outcome                                               | measure-lcp exit          | Posting step                                            | Build                            |
| --------------------------------------------------------- | ------------------------- | ------------------------------------------------------- | -------------------------------- |
| All scenarios measured                                    | 0                         | posts everything                                        | green                            |
| Optional scenario(s) failed, all required OK              | 0, with warnings          | posts survivors (the poster skips errored measurements) | green + TeamCity WARNING message |
| Any required scenario failed                              | 1                         | never reached                                           | red, nothing posted              |
| ALL scenarios in the run set failed                       | 1                         | never reached                                           | red, nothing posted              |
| `SCENARIO` value matches no scenario                      | 1, before any measurement | never reached                                           | red                              |
| Any scenario measured, but a value fails its sanity range | 0                         | atomic sanity gate refuses the whole POST (exit 2)      | red, nothing posted              |

The last row is the flag's deliberate scope boundary: `optional` isolates **measurement failures** — a scenario that throws, produces no summary, or produces a partial one (a posted field dropped for lack of a strict majority of finite samples across iterations; `measure-lcp.js` converts that into a scenario error, so the optional/required policy applies to it like any other failure). A scenario that measures successfully but yields an out-of-range value — even an optional one — is a data-integrity event, and the pre-existing all-or-nothing sanity gate (see Sanity-range assertions above) still suppresses the entire post and reds the build so a human looks at the anomalous data. The poster also enforces the required side itself: a results file recording a **required** scenario's measurement failure makes `post-to-codevitals.js` fail closed (exit 2) even via the direct `pnpm report` entrypoint, so a red run's saved artifact cannot post its optional survivors and set up retry duplicates.

Why a required failure suppresses **all** posting (retry-safety invariant): a red build has posted nothing, so re-running it cannot append duplicate points to the append-only, dedup-off store. Posting the survivors first and then failing would turn every retry into duplicate trend points. The converse is why an optional-only failure must exit 0: green builds don't get retried. (Re-running a green partial build duplicates its survivor points — the same pre-existing hazard as re-running any green build today.)

The all-failed row keeps targeted runs honest: `SCENARIO=forms-responses` with a failing formsResponses still exits 1 even though the scenario is optional, so a single-scenario local run fails loudly instead of green-exiting with nothing measured.

Classifying a scenario: default NEW scenarios to `optional: true` — a new page's teething failures shouldn't blank the established trends. Promoting a scenario to `optional: false` (required) is a deliberate act; `jetpackConnected` (the wp-admin Dashboard baseline) is the required one.

A green build can therefore carry a skipped scenario. Where to look: the TeamCity WARNING message on the build page, the per-scenario `FAILED (optional — build continues…)` summary line in the build log, and — once live — the FORMS-723 staleness alert as the systemic detector for a series that has quietly gone dark.

### If bad data lands anyway

A bad point must be corrected by the CodeVitals admin. Steps:

1. **Stop posting.** Pause the CodeVitals Jetpack Performance Scheduler build in TeamCity.
2. **Document the extent.** Record the affected metric keys, the commit range (monorepo hashes), the time window (build start to end), and whether the values are isolated or systematic.
3. **Request a correction.** CodeVitals runs outside this project; send the request through the team channel named in the FORMS-696 runbook. Include metric ID 113, the affected keys, the commit/timestamp range, and the root cause.
4. **Fix the root cause.** Add or tighten a sanity range or staging gate. Don't re-enable the Scheduler until the fix merges.
5. **Record the incident.** Add the failure mode, detection timing, and prevention measures to the FORMS-696 maintenance runbook.
