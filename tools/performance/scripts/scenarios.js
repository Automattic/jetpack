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
