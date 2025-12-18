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

| Variable | Description |
|----------|-------------|
| `CODEVITALS_TOKEN` | API token for posting results to CodeVitals |
| `CODEVITALS_URL` | CodeVitals API URL (default: https://www.codevitals.run) |
| `COMPOSE_PROJECT_NAME` | Unique Docker project name for build isolation |
| `GIT_COMMIT` | Git commit SHA for tracking (auto-detected from plugin) |
| `GIT_BRANCH` | Git branch for tracking (default: trunk) |
| `ITERATIONS` | Number of measurement iterations (default: 5) |
| `WP_ADMIN_USER` | WordPress admin username (default: admin) |
| `WP_ADMIN_PASS` | WordPress admin password (default: password) |

## Metric

- `wp-admin-dashboard-connection-sim-largestContentfulPaint` - Dashboard LCP with simulated Jetpack connection

## How It Works

1. **Plugin Source**: Uses pre-built plugin from [jetpack-production](https://github.com/Automattic/jetpack-production) mirror (auto-cloned for local dev)
2. **Docker Setup**: Spins up WordPress with Jetpack and a simulated WordPress.com connection (fake tokens + mocked API with 200ms latency)
3. **CPU Calibration**: Normalizes CPU speed across different machines for consistent results
4. **LCP Measurement**: Uses Playwright to log in to wp-admin and measure Largest Contentful Paint
5. **Results**: Posts metrics to CodeVitals for tracking over time

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm test` | Run full test suite (auto-clones plugin if needed) |
| `pnpm test:quick` | Quick test with 2 iterations |
| `pnpm calibrate` | Run CPU throttling calibration |
| `pnpm measure` | Run LCP measurement only |
| `pnpm report` | Post results to CodeVitals only |
| `pnpm test -- --skip-codevitals` | Run tests without posting to CodeVitals |
