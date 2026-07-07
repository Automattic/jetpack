/**
 * Scenario definitions - single source of truth for all test scenarios
 *
 * This module defines the test scenarios used across:
 * - measure-lcp.js (measurement)
 * - post-to-codevitals.js (metrics posting)
 * - run-performance-tests.js (WordPress instance checks)
 *
 * To add a new scenario:
 * 1. Add an entry to the SCENARIOS array below.
 * 2. To measure another PAGE on an existing WordPress instance, reuse that instance's
 * dockerService/wpPath/envVar/defaultUrl and set `path` + `waitForSelector` (see formsResponses);
 * no new Docker service or setup is needed.
 * 3. Only when introducing a NEW WordPress instance, add the Docker service in
 * docker/docker-compose.yml and its setup in docker/setup-wordpress.sh.
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
		// Metrics posted for this scenario, all in a single CodeVitals call. Each entry is:
		//   field         — the summary field to read the value from (summary.<field>.median)
		//   codevitalsKey — the exact CodeVitals metric key to post to
		//   type          — the SANITY_RANGES key; REQUIRED, drives the range check in
		//                   post-to-codevitals.js. A keyed metric with no type is refused.
		// When introducing a NEW metric, post it to a `-staging` key first (e.g.
		// `…-timeToFirstByte-staging`) for 2-3 builds, inspect it in the CodeVitals UI, then
		// rename to the production key. See the "Safeguards" section of README.md for the
		// full convention. (LCP/TTFB/FCP below post straight to production keys by decision.)
		metrics: [
			{
				field: 'lcp',
				codevitalsKey: 'wp-admin-dashboard-connection-sim-largestContentfulPaint',
				type: 'lcp',
			},
			{
				field: 'ttfb',
				codevitalsKey: 'wp-admin-dashboard-connection-sim-timeToFirstByte',
				type: 'ttfb',
			},
			{
				field: 'fcp',
				codevitalsKey: 'wp-admin-dashboard-connection-sim-firstContentfulPaint',
				type: 'fcp',
			},
		],
		postToCodeVitals: true,
		isBaseline: false,
	},
	{
		key: 'formsResponses',
		name: 'Forms responses (wp-build, connected sim)',
		cliName: 'forms-responses',
		// Same WordPress instance as the Dashboard scenario — just a different page — so no new
		// Docker service is needed; only `path`/`waitForSelector` below differ.
		dockerService: 'wordpress-jetpack-connected',
		wpPath: '/var/www/html/jetpack-connected',
		envVar: 'WP_JETPACK_CONNECTED_URL',
		defaultUrl: 'http://localhost:8083',
		header: 'Forms Responses (wp-build dashboard, Simulated + 200ms Latency)',
		// The wp-build Forms responses dashboard. Its shared `boot` shell pulls core
		// @wordpress/editor into a page that never opens an editor, so its runtime payload
		// (decodedBytesKB) is the surface the bundle-size metric watches. measure-lcp.js
		// navigates here after login and waits for the React root to hydrate.
		//
		// The `p` route is pinned to the responses inbox on purpose. Without it, class-dashboard.php
		// server-redirects a bare page URL to the DEFAULT tab, which with Central Form Management
		// (the live default) is `/forms` — the forms LIST, not the responses inbox. Measuring that
		// would populate the `forms-responses-*` keys from the wrong page. `expectUrlIncludes` makes
		// measure-lcp.js fail the run if a future redirect change moves us off the inbox.
		path: '/wp-admin/admin.php?page=jetpack-forms-responses-wp-admin&p=%2Fresponses%2Finbox',
		waitForSelector: '#jetpack-forms-responses-wp-admin-app.boot-layout-container',
		expectUrlIncludes: '/responses/inbox',
		// A healthy load of this page fetches ~80 resources; measure-lcp.js fails the run if it
		// captures fewer than this, so a truncated/partial capture can't post an in-range but
		// undercounted decodedBytesKB. Kept well below the real count (2x margin) and count-based,
		// not editor-asset-based, so it never clips the legitimate drop when the editor lazy-loads.
		minResourceCount: 40,
		// These four post straight to PRODUCTION keys — the `-staging` window in the README
		// Safeguards is deliberately waived here (owner decision). The substitute for that window is
		// the SANITY_RANGES + all-or-nothing gate plus manual sign-off before the first live post;
		// the dry-run's stdDev-0 shows repeatability, not correctness, so it is not the safeguard.
		metrics: [
			{
				field: 'lcp',
				codevitalsKey: 'forms-responses-connection-sim-largestContentfulPaint',
				type: 'lcp',
			},
			{
				field: 'ttfb',
				codevitalsKey: 'forms-responses-connection-sim-timeToFirstByte',
				type: 'ttfb',
			},
			{
				field: 'fcp',
				codevitalsKey: 'forms-responses-connection-sim-firstContentfulPaint',
				type: 'fcp',
			},
			{
				// The bundle-size metric: summed per-resource decodedBodySize in KB (see
				// measure-lcp.js). A trend line that falls when the editor modules are
				// lazy-loaded and flags the next silent jump. The key suffix matches the field
				// (decodedBytesKB) — a whole-page KB SUM — not the raw per-resource
				// `decodedBodySize` property, which is a distinct nav-document value in measure-lcp.js.
				field: 'decodedBytesKB',
				codevitalsKey: 'forms-responses-connection-sim-decodedBytesKB',
				type: 'decodedBytesKB',
			},
		],
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
	// Summed per-resource decodedBodySize, in KB. The Forms responses wp-build dashboard
	// measures ~8200 KB (deterministic across iterations). These are guardrails against a
	// broken measurement, NOT a trend clip: min 1000 catches a page that failed to load its
	// wp-build shell (a real dashboard is always well over 1MB decoded); max 51200 (50MB)
	// catches a bytes-vs-KB scale error while staying clear of any legitimate regression, which
	// the trend should record rather than reject.
	decodedBytesKB: { min: 1000, max: 51200 },
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
