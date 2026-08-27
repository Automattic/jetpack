/**
 * Playwright configuration for PayPal Payment Buttons E2E tests.
 *
 * Designed to work with Jetpack's existing Playwright infrastructure.
 * Uses a local WordPress test site with mocked PayPal API responses.
 *
 * @package
 * @since 0.8.0
 */

const { defineConfig, devices } = require( '@playwright/test' );

module.exports = defineConfig( {
	testDir: './',
	testMatch: '*.spec.js',
	fullyParallel: false,
	forbidOnly: !! process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: 1,
	reporter: process.env.CI ? 'github' : 'list',
	timeout: 60000,

	use: {
		baseURL: process.env.WP_BASE_URL || 'http://localhost:8889',
		storageState: process.env.WP_AUTH_STORAGE || undefined,
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
		video: 'retain-on-failure',
	},

	projects: [
		{
			name: 'chromium',
			use: { ...devices[ 'Desktop Chrome' ] },
		},
	],

	// Web server config for local development.
	// Assumes wp-env or similar local WordPress environment is already running.
	// Uncomment and configure if using wp-env:
	//
	// webServer: {
	//   command: 'npx wp-env start',
	//   url: 'http://localhost:8889',
	//   reuseExistingServer: ! process.env.CI,
	// },
} );
