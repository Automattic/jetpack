# Jetpack Performance Testing

Measures wp-admin dashboard LCP (Largest Contentful Paint) for Jetpack with simulated WordPress.com connection.

## CI Usage

The test suite is designed to run in TeamCity. See build configuration for setup.

### Build Steps

1. Build Jetpack plugin
2. Install dependencies (`pnpm install`)
3. Install Playwright (`pnpm exec playwright install chromium --with-deps`)
4. Calibrate CPU throttling (`pnpm calibrate`)
5. Run tests (`pnpm test --skip-rsync`)

### Environment Variables

| Variable | Description |
|----------|-------------|
| `CODEVITALS_TOKEN` | API token for posting results to CodeVitals |
| `COMPOSE_PROJECT_NAME` | Unique Docker project name for build isolation |
| `GIT_COMMIT` | Git commit SHA for tracking |
| `ITERATIONS` | Number of measurement iterations (default: 5) |

## Metric

- `wp-admin-dashboard-connection-sim-largestContentfulPaint` - Dashboard LCP with simulated Jetpack connection

## How It Works

1. **Docker Setup**: Spins up WordPress with Jetpack and a simulated WordPress.com connection (fake tokens + mocked API with 200ms latency)
2. **CPU Calibration**: Normalizes CPU speed across different machines for consistent results
3. **LCP Measurement**: Uses Playwright to log in to wp-admin and measure Largest Contentful Paint
4. **Results**: Posts metrics to CodeVitals for tracking over time

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm test` | Run full test suite |
| `pnpm calibrate` | Run CPU throttling calibration |
| `pnpm test -- --skip-rsync` | Run tests without rebuilding Jetpack |
| `pnpm test -- --skip-codevitals` | Run tests without posting to CodeVitals |
