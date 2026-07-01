/**
 * Scenario definitions - single source of truth for all test scenarios
 *
 * This module defines the test scenarios used across:
 * - measure-lcp.js (measurement)
 * - post-to-codevitals.js (metrics posting)
 * - run-performance-tests.js (WordPress instance checks)
 *
 * To add a new scenario:
 * 1. Add an entry to SCENARIOS array below
 * 2. Add corresponding Docker service in docker/docker-compose.yml
 * 3. Add setup in docker/setup-wordpress.sh
 */

export const SCENARIOS = [
	{
		key: 'jetpackConnected',
		name: 'Jetpack (connected sim)',
		cliName: 'jetpack-connected',
		dockerService: 'wordpress-jetpack-connected',
		wpPath: '/var/www/html/jetpack-connected',
		envVar: 'WP_JETPACK_CONNECTED_URL',
		defaultUrl: 'http://localhost:8083',
		header: 'Jetpack Connected (Simulated + 200ms Latency)',
		metricPrefix: 'wp_admin_lcp_jetpack_connected',
		// CodeVitals key for the posted metric. When introducing a NEW metric, post
		// it to a `-staging` key first (e.g. `…-timeToFirstByte-staging`) for 2-3
		// builds, inspect it in the CodeVitals UI, then rename to the production key.
		// See the "Safeguards" section of README.md for the full convention.
		metricKey: 'wp-admin-dashboard-connection-sim-largestContentfulPaint-v2',
		// Metric type — drives the sanity-range check in post-to-codevitals.js.
		metricType: 'lcp',
		postToCodeVitals: true,
		isBaseline: false,
	},
];

/**
 * Sanity ranges for posted metrics, keyed by metric type.
 *
 * post-to-codevitals.js checks every typed metric against these bounds before
 * posting. A value outside its range is logged and skipped (never posted),
 * because CodeVitals is append-only and bad points cannot be rolled back.
 * Add a row when a new metric type starts being posted.
 *
 * @type {Object<string, {min: number, max: number}>}
 */
export const SANITY_RANGES = {
	lcp: { min: 100, max: 60000 }, // <100ms is suspicious; >60s means the page never loaded.
	ttfb: { min: 10, max: 10000 }, // <10ms is unrealistic; >10s means server failure.
	fcp: { min: 50, max: 30000 },
	tbt: { min: 0, max: 10000 }, // Can legitimately be 0; >10s is catastrophic.
	cls: { min: 0, max: 5 }, // >5 would mean the page is unusable.
};

/**
 * Get the URL for a scenario from environment or default
 *
 * Uses the environment variable if set and non-empty, otherwise falls back to default.
 *
 * @param {object} scenario - Scenario object from SCENARIOS
 * @return {string} The URL for the scenario
 */
export function getScenarioUrl( scenario ) {
	const envValue = process.env[ scenario.envVar ];
	// Only use env value if it's defined and non-empty (trim to handle whitespace-only values)
	const trimmedValue = envValue?.trim();
	return trimmedValue || scenario.defaultUrl;
}
