# Jetpack Performance Testing Suite

A performance baseline testing infrastructure for measuring Jetpack's impact on WordPress wp-admin dashboard load times using Largest Contentful Paint (LCP).

## Overview

This tool measures **Largest Contentful Paint (LCP)** for the WordPress wp-admin dashboard across four scenarios:

1. **Baseline**: WordPress with no Jetpack installed
2. **Jetpack Disconnected**: Jetpack installed but not connected to WordPress.com
3. **Jetpack Offline Mode**: Jetpack with `JETPACK_DEV_DEBUG` enabled (bypasses connection checks)
4. **Jetpack Connected (Simulated)**: Fake connection tokens + mocked WP.com API with configurable latency

### Scenario Comparison

| Mode | WP.com Connection | Code Paths Active | Latency Simulation | What It Measures |
|------|-------------------|-------------------|-------------------|------------------|
| **Disconnected** | None | Minimal | None | Base overhead of Jetpack plugin code |
| **Offline Mode** | None (bypassed) | Most features | None | Overhead when Jetpack code executes locally |
| **Connected (Sim)** | Mocked | Most features | Yes (200ms default) | Overhead including simulated API latency |

- **Disconnected**: Jetpack is installed and activated but has never been connected. Most Jetpack features are disabled because `Jetpack::is_connection_ready()` returns false. This shows the "bare minimum" PHP overhead.

- **Offline Mode**: Uses `JETPACK_DEV_DEBUG` constant to bypass connection checks, enabling more Jetpack code paths to execute locally. No network latency - only local PHP overhead.

- **Connected (Simulated)**: Uses an mu-plugin that:
  - Sets fake connection tokens so Jetpack thinks it's connected
  - Intercepts all HTTP requests to `*.wordpress.com` via `pre_http_request` filter
  - Returns mock API responses with configurable artificial latency (default: 200ms)
  - Activates additional modules that work without real connection (see below)
  - Provides the most realistic simulation of a connected site without actual OAuth

### Modules Activated in Connected Scenario

The simulated connection scenario activates these additional modules beyond the defaults:

| Module | Description | Why Safe |
|--------|-------------|----------|
| `shortcodes` | Embed shortcodes (YouTube, Twitter, etc.) | Embeds render client-side |
| `markdown` | Markdown support for posts | Fully local processing |
| `sharedaddy` | Social sharing buttons | No backend validation |
| `sitemaps` | XML sitemap generation | Fully local |
| `seo-tools` | SEO meta tags and previews | Fully local |
| `widget-visibility` | Widget display rules | Fully local |
| `custom-content-types` | Portfolio/Testimonial CPTs | Fully local |

**Not activated** (require real connection): `sso`, `publicize`, `subscriptions`, `related-posts`, `search`, `wordads`, `monitor`, `photon` (CDN images would fail)

Results are automatically posted to [CodeVitals](https://www.codevitals.run) for tracking performance trends over time.

## Architecture

```
tools/performance/
├── scripts/
│   ├── calibrate-throttling.js   # CPU throttling calibration script
│   ├── measure-lcp.js            # Playwright script to measure LCP
│   ├── post-to-codevitals.js     # Posts metrics to CodeVitals API
│   ├── run-performance-tests.js  # Main orchestrator script
│   ├── scenarios.js              # Scenario definitions (single source of truth)
│   └── stats.js                  # Shared statistics utilities (median, mean, stdDev)
├── docker/
│   ├── docker-compose.yml        # 4 WordPress instances + MySQL
│   ├── init-databases.sql        # Database initialization
│   ├── setup-wordpress.sh        # WordPress setup via WP-CLI
│   └── mu-plugins/               # Must-use plugins for testing
│       └── simulate-wpcom-connection.php  # Fake WP.com connection with latency
├── build/                        # Auto-generated, gitignored
│   └── jetpack/                  # Rsync'd Jetpack plugin (symlinks resolved)
├── results/
│   └── lcp-results.json          # Performance measurement results
├── calibration.json              # CPU throttling calibration (gitignored, per-machine)
├── package.json                  # Node.js dependencies
├── eslint.config.mjs             # ESLint configuration for CLI scripts
├── quickstart.sh                 # One-shot setup and test script
├── README.md                     # This file
└── TEAMCITY-SETUP.md            # TeamCity configuration guide
```

## Quick Start

### Prerequisites

- **Docker** (with Docker Compose)
- **Node.js** 18+
- **pnpm** (for monorepo tooling)
- **GNU rsync** (macOS users: `brew install rsync`)

### 1. Build Jetpack (if not already built)

The test script automatically rsyncs Jetpack to resolve symlinks, but Jetpack must be built first:

```bash
# From monorepo root
pnpm install
pnpm jetpack build plugins/jetpack
```

### 2. Install Dependencies

```bash
cd tools/performance
pnpm install
pnpm run setup:browsers  # Installs Playwright browsers
```

### 3. Run Tests Locally

```bash
# Run full suite (rsyncs Jetpack, starts Docker, sets up WordPress, runs tests)
pnpm test

# Quick test with fewer iterations
pnpm run test:quick

# Or run individual steps:
pnpm run docker:up      # Start Docker containers
pnpm run docker:setup   # Set up WordPress instances
pnpm run measure        # Run LCP measurements only

# Command line options:
pnpm test -- --skip-setup              # Skip WordPress setup (assumes already running)
pnpm test -- --skip-rsync              # Skip Jetpack rsync (use existing build/)
pnpm test -- --skip-codevitals         # Skip posting to CodeVitals
pnpm test -- --allow-codevitals-failure # Continue if CodeVitals posting fails
```

The test script automatically:
1. Rsyncs Jetpack to `build/jetpack/` (resolves symlinks from `jetpack_vendor/`)
2. Starts Docker containers
3. Sets up WordPress instances
4. Runs LCP measurements
5. Posts results to CodeVitals (if token configured)

### 4. CPU Throttling Calibration (Recommended)

For consistent results across different machines, run the calibration script:

```bash
# Run calibration (creates calibration.json)
pnpm calibrate

# Faster calibration with fewer passes
CALIBRATION_PASSES=3 pnpm calibrate
```

**What it does:**
- Runs a synthetic benchmark to measure your machine's CPU speed
- Finds a CPU throttle rate that normalizes performance to a target score (1000)
- Saves the result to `calibration.json` (gitignored, per-machine)
- Future tests automatically apply this throttle rate via Chrome DevTools Protocol

**Why it matters:**
- Without calibration, a fast machine might report 80ms LCP while a slow machine reports 200ms
- With calibration, both machines report similar results (e.g., ~120ms)
- This enables meaningful comparisons across different CI agents and developer machines

If no `calibration.json` exists, tests will run without throttling and display a warning.

### 5. View Results

Results are saved to `results/lcp-results.json` and include:
- Median, mean, min, max LCP for each scenario
- Standard deviation
- Raw measurement data for each iteration
- Resource counts and performance metrics

Example output:
```
Summary Comparison (LCP - Largest Contentful Paint):

  Baseline WordPress:        1234ms
  Jetpack (disconnected):    1456ms (+222ms, +18.0%)
  Jetpack (offline mode):    1489ms (+255ms, +20.7%)
  Jetpack (connected sim):   1623ms (+389ms, +31.5%)
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `CODEVITALS_URL` | `https://www.codevitals.run` | CodeVitals instance URL |
| `CODEVITALS_TOKEN` | _(required for posting)_ | CodeVitals API token |
| `ITERATIONS` | `5` | Number of measurement iterations per scenario |
| `CALIBRATION_PASSES` | `9` | Number of calibration passes (more = more accurate) |
| `COMPOSE_PROJECT_NAME` | `jetpack-perf` | Docker Compose project name (for parallel builds) |
| `WP_ADMIN_USER` | `admin` | WordPress admin username |
| `WP_ADMIN_PASS` | `password` | WordPress admin password |
| `WP_BASELINE_URL` | _(auto-discovered)_ | Baseline WordPress URL (dynamic port) |
| `WP_JETPACK_URL` | _(auto-discovered)_ | Jetpack WordPress URL (dynamic port) |
| `WP_JETPACK_OFFLINE_URL` | _(auto-discovered)_ | Jetpack Offline WordPress URL (dynamic port) |
| `WP_JETPACK_CONNECTED_URL` | _(auto-discovered)_ | Jetpack Connected (Simulated) URL (dynamic port) |
| `WPCOM_SIMULATED_LATENCY_MS` | `200` | Simulated WP.com API latency in milliseconds |
| `MYSQL_READY_TIMEOUT_SECONDS` | `120` | Timeout for MySQL readiness check during setup |
| `WP_READY_TIMEOUT_SECONDS` | `60` | Timeout for WordPress readiness check during setup |

### Docker Configuration

The test suite uses four separate WordPress instances. **Ports are assigned dynamically** by Docker to support parallel builds on shared CI agents. The test script automatically discovers the assigned ports at runtime.

| Scenario | Docker Service | Database |
|----------|----------------|----------|
| Baseline | `wordpress-baseline` | `wp_baseline` |
| Jetpack Disconnected | `wordpress-jetpack` | `wp_jetpack` |
| Jetpack Offline Mode | `wordpress-jetpack-offline` | `wp_jetpack_offline` |
| Jetpack Connected (Sim) | `wordpress-jetpack-connected` | `wp_jetpack_connected` |

All instances share a single MySQL database server with separate databases:
- `wp_baseline`
- `wp_jetpack`
- `wp_jetpack_offline`
- `wp_jetpack_connected`

### Configuring Simulated Latency

The connected scenario uses a configurable simulated latency for mocked WP.com API calls:

```bash
# Default: 200ms latency
pnpm test

# Custom latency (e.g., 500ms to simulate slow connection)
WPCOM_SIMULATED_LATENCY_MS=500 pnpm test

# No latency (just mock responses)
WPCOM_SIMULATED_LATENCY_MS=0 pnpm test
```

**Known limitation**: The simulated latency is applied serially (using `usleep()`) for each intercepted WordPress.com API request. In a real connected scenario, multiple API requests would happen in parallel over the network. This means the simulated latency may slightly overestimate the actual performance impact of network latency when multiple API calls occur during a single page load. For accurate latency simulation, consider using `WPCOM_SIMULATED_LATENCY_MS=0` to measure PHP overhead separately from network effects.

## TeamCity Integration

See [TEAMCITY-SETUP.md](./TEAMCITY-SETUP.md) for detailed instructions on setting up this test suite in TeamCity.

**Quick summary:**
1. Create build configuration
2. Add build steps for clone, build, calibrate, test
3. Configure `CODEVITALS_TOKEN` parameter
4. Run build manually or on schedule

**Calibration in CI:**
Run calibration as the first step before tests to ensure consistent results across different agents:

```bash
cd tools/performance
pnpm calibrate
```

Each build runs fresh calibration (~30-60s) since different agents may have different CPU speeds.

## CodeVitals Metrics

The following metric is posted to CodeVitals:

- `wp-admin-dashboard-connection-sim-largestContentfulPaint` - Jetpack connected (simulated) LCP

**Note**: Currently only the "Jetpack Connected (Simulated)" scenario posts to CodeVitals. This metric represents the wp-admin dashboard load time with Jetpack in a simulated connected state (fake tokens + mocked API with 200ms latency). All four scenarios are measured locally and saved to `results/lcp-results.json`, but only the connected scenario is tracked in CodeVitals for trend analysis.

## How It Works

### 1. Jetpack Rsync

Before starting Docker, the test script runs `pnpm jetpack rsync` to copy the Jetpack plugin to `build/jetpack/` with all symlinks resolved. This is necessary because:

- The monorepo uses symlinks in `jetpack_vendor/` pointing to `packages/`
- Docker volume mounts don't resolve symlinks from the host
- The rsync step copies actual files instead of symlinks

Use `--skip-rsync` flag if you've already synced and want faster iteration.

### 2. Environment Setup

The `docker-compose.yml` creates four isolated WordPress environments:
- Separate databases per instance
- Shared MySQL server
- Volume mounts for rsync'd Jetpack plugin from `build/jetpack/`
- WP-CLI container for setup automation
- `WORDPRESS_CONFIG_EXTRA` for offline mode configuration

### 3. WordPress Installation

The `setup-wordpress.sh` script:
- Waits for WordPress containers to be ready
- Installs WordPress via WP-CLI
- Activates Jetpack plugin (scenarios 2, 3 & 4)
- Offline mode uses `JETPACK_DEV_DEBUG` via `WORDPRESS_CONFIG_EXTRA`

### 4. Performance Measurement

The `measure-lcp.js` script uses Playwright to:
- Launch headless Chromium browser
- Navigate to wp-login.php
- Log in with provided credentials
- Wait for dashboard to fully load
- Collect LCP via Performance Observer API
- Capture additional metrics (FCP, DOM timing, resource counts)
- Repeat for statistical accuracy (default: 5 iterations)
- Calculate median, mean, std dev

### 5. Results Processing

The `post-to-codevitals.js` script:
- Reads measurement results
- Calculates overhead vs baseline
- Formats metrics for CodeVitals API
- Posts to CodeVitals with git commit info
- Enables baseline normalization for trend tracking

## Measurement Methodology

### Why LCP?

**Largest Contentful Paint (LCP)** is a Core Web Vital that measures when the largest content element becomes visible. It's ideal because:

- Built into browser Performance API (reliable)
- Industry-standard metric (comparable)
- Correlates well with perceived load time
- Captures actual rendering completion

### Statistical Approach

We use **median** as the primary metric because:
- More robust against outliers
- Better represents typical user experience
- Less affected by background processes

Multiple iterations (default: 5) ensure:
- Statistical validity
- Detection of variance
- Outlier identification

### System Warmup & Normalization

Each measurement:
- Starts a fresh browser instance
- Applies CPU throttling if calibration exists (via Chrome DevTools Protocol)
- Performs fresh login
- Waits 2 seconds between iterations
- Uses consistent viewport size (1920x1080)

**CPU Throttling Calibration** ensures consistent results across machines by:
- Running a synthetic benchmark (string building + array copying)
- Finding a throttle rate that normalizes to a target score (1000)
- Applying this rate during measurements via `Emulation.setCPUThrottlingRate`

## Troubleshooting

### Docker Issues

**Problem**: Ports already in use
```bash
# Solution: Stop existing containers
pnpm run docker:down
```

**Problem**: Containers won't start
```bash
# Solution: Check Docker is running
docker info

# View logs
pnpm run docker:logs
```

### WordPress Setup Issues

**Problem**: WordPress installation fails
```bash
# Solution: Reset everything and try again
pnpm run docker:reset
```

**Problem**: Jetpack not found or symlink errors
```bash
# Solution: Ensure Jetpack is built and rsync'd
cd ../..  # Back to monorepo root
pnpm jetpack build plugins/jetpack
cd tools/performance
rm -rf build/  # Force fresh rsync
pnpm test
```

**Problem**: Rsync fails on macOS
```bash
# Solution: Install GNU rsync (macOS's built-in rsync has symlink limitations)
brew install rsync
```

**Problem**: Jetpack activation fails with "file not found" errors
```bash
# Solution: The jetpack_vendor symlinks weren't resolved. Force re-rsync:
rm -rf build/
pnpm test
```

### Measurement Issues

**Problem**: Browser timeout
- Increase timeout in `measure-lcp.js`
- Check WordPress instances: `curl http://localhost:8080`

**Problem**: Inconsistent measurements
- Increase iterations: `ITERATIONS=10 pnpm test`
- Check system load: Close other applications
- Verify Docker has sufficient resources (4GB+ RAM recommended)

### Calibration Issues

**Problem**: "Machine is too slow for calibration"
- Your machine's unthrottled benchmark score is below the target (1000)
- This machine cannot be normalized to the baseline
- Consider using a faster machine or skipping calibration (results will vary)

**Problem**: Calibration takes too long
```bash
# Use fewer passes (default is 9)
CALIBRATION_PASSES=3 pnpm calibrate
```

**Problem**: Want to re-run calibration
```bash
# Delete existing calibration and re-run
rm calibration.json
pnpm calibrate
```

### CodeVitals Issues

**Problem**: Posting fails
- Verify token: `echo $CODEVITALS_TOKEN`
- Test connectivity: `curl https://www.codevitals.run`
- Check project exists in CodeVitals

## pnpm Scripts Reference

| Script | Description |
|--------|-------------|
| `pnpm test` | Run full test suite (recommended - handles all setup automatically) |
| `pnpm run test:quick` | Run with 2 iterations (faster) |
| `pnpm calibrate` | Run CPU throttling calibration (creates `calibration.json`) |
| `pnpm run measure` | Run LCP measurements only (requires WordPress to be running) |
| `pnpm run report` | Post results to CodeVitals |
| `pnpm run setup:browsers` | Install Playwright browsers |
| `pnpm run docker:up` | Start Docker containers (requires `build/jetpack/` to exist first) |
| `pnpm run docker:down` | Stop and remove containers |
| `pnpm run docker:setup` | Run WordPress setup (requires containers to be running) |
| `pnpm run docker:logs` | View container logs |
| `pnpm run docker:reset` | Full reset and setup |

**Note**: For most use cases, just run `pnpm test` - it handles rsync, Docker startup, and WordPress setup automatically. Run `pnpm calibrate` once per machine for consistent results. The individual `docker:*` scripts are for advanced use or debugging.

## Future Enhancements

### Phase 2: TTVC Support
- Add @dropbox/ttvc measurement via browser injection
- Compare TTVC vs LCP correlation

### Phase 3: Sync Performance Testing
- Instrument Jetpack Sync operations
- Measure sync batch processing time
- Track database query counts
- Monitor API call latency

### Phase 4: Expanded Coverage
- Test additional WordPress pages (posts, media, plugins)
- Measure JavaScript execution time
- Track network payload sizes

## Support

For questions or issues:
- Check this README and TEAMCITY-SETUP.md
- Review build logs in TeamCity
- Check CodeVitals dashboard

## License

This tool is part of the Jetpack monorepo and follows the same licensing.

---
