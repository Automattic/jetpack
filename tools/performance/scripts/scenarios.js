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
		key: 'baseline',
		name: 'Baseline (no Jetpack)',
		cliName: 'baseline',
		envVar: 'WP_BASELINE_URL',
		defaultUrl: 'http://localhost:8080',
		header: 'Scenario 1: Baseline WordPress (no Jetpack)',
		metricPrefix: 'wp_admin_lcp_baseline',
		isBaseline: true,
	},
	{
		key: 'jetpackDisconnected',
		name: 'Jetpack (disconnected)',
		cliName: 'jetpack-disconnected',
		envVar: 'WP_JETPACK_URL',
		defaultUrl: 'http://localhost:8081',
		header: 'Scenario 2: Jetpack Installed (Not Connected)',
		metricPrefix: 'wp_admin_lcp_jetpack_disconnected',
		isBaseline: false,
	},
	{
		key: 'jetpackOffline',
		name: 'Jetpack (offline mode)',
		cliName: 'jetpack-offline',
		envVar: 'WP_JETPACK_OFFLINE_URL',
		defaultUrl: 'http://localhost:8082',
		header: 'Scenario 3: Jetpack Offline Mode (JETPACK_DEV_DEBUG)',
		metricPrefix: 'wp_admin_lcp_jetpack_offline',
		isBaseline: false,
	},
	{
		key: 'jetpackConnected',
		name: 'Jetpack (connected sim)',
		cliName: 'jetpack-connected',
		envVar: 'WP_JETPACK_CONNECTED_URL',
		defaultUrl: 'http://localhost:8083',
		header: 'Scenario 4: Jetpack Connected (Simulated + 200ms Latency)',
		metricPrefix: 'wp_admin_lcp_jetpack_connected',
		metricKey: 'wp-admin-dashboard-connection-sim-largestContentfulPaint',
		postToCodeVitals: true,
		isBaseline: false,
	},
];

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
