import { defineConfig, devices } from '@playwright/test';
import surfaces, { type Surface } from './tests/sites';

/**
 * Every spec in tests/specs runs once per surface. Surfaces come from tests/sites.ts, so
 * adding a platform is one entry there rather than a new directory of tests.
 *
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig< { surface: Surface } >( {
	/* Run tests in files in parallel */
	fullyParallel: true,
	/* Fail the build on CI if you accidentally left test.only in the source code. */
	forbidOnly: !! process.env.CI,
	/* Retry on CI only */
	retries: process.env.CI ? 2 : 0,
	/* A page load, a WordPress.com login popup, the block editor fetched from
	   widgets.wp.com, and the wait for a subscription modal that may never open all have
	   to fit inside one test, so 30s is nowhere near enough. */
	timeout: 120000,
	expect: {
		timeout: 30000,
	},
	/* Opt out of parallel tests on CI. */
	workers: process.env.CI ? 1 : undefined,
	/* Reporter to use. See https://playwright.dev/docs/test-reporters */
	reporter: 'html',
	use: {
		/* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
		trace: 'on-first-retry',
	},

	projects: [
		{
			// Refuses to let the rest of the suite run against production.
			name: 'sandbox check',
			testDir: './tests',
			testMatch: '00_confirm_sandboxed.test.ts',
			// Use FF because it respects the hosts file.
			use: { ...devices[ 'Desktop Firefox' ] },
		},
		...surfaces.map( surface => ( {
			name: surface.name,
			testDir: './tests/specs',
			dependencies: [ 'sandbox check' ],
			use: { ...devices[ 'Desktop Firefox' ], surface },
		} ) ),
	],
} );
