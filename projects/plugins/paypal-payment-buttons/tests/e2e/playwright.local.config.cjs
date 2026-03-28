/**
 * Local Playwright config for running PayPal Payment Buttons E2E tests
 * against a wp-env instance without the full Jetpack E2E infrastructure.
 */

const { defineConfig, devices } = require( '@playwright/test' );

module.exports = defineConfig( {
	testDir: './',
	testMatch: 'paypal-payment-buttons.spec.cjs',
	fullyParallel: false,
	forbidOnly: false,
	retries: 0,
	workers: 1,
	reporter: [ [ 'list' ], [ 'json', { outputFile: './output/results.json' } ] ],
	timeout: 60000,

	use: {
		baseURL: process.env.WP_BASE_URL || 'http://localhost:8889',
		headless: true,
		viewport: { width: 1280, height: 1600 },
		actionTimeout: 20000,
		trace: 'retain-on-failure',
		screenshot: 'only-on-failure',
		video: 'retain-on-failure',
	},

	projects: [
		{
			name: 'auth-setup',
			testMatch: 'auth-setup.cjs',
		},
		{
			name: 'paypal-e2e',
			testMatch: 'paypal-payment-buttons.spec.cjs',
			dependencies: [ 'auth-setup' ],
			use: {
				...devices[ 'Desktop Chrome' ],
				storageState: './output/storage-state.json',
			},
		},
	],
} );
