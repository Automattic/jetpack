/**
 * Playwright Test config for the premium-analytics UI verification suite.
 *
 * Designed to run inside the jetpack-ai-sandbox container against the wp-verify
 * docker-compose stack. The `wp-verify.sh up` step (in the verify-ui skill) brings up
 * the WordPress container at `http://wordpress`; this config drives a single Chromium
 * browser through it.
 *
 * Workers stay at 1 because the WP backend is shared single-tenant — parallel logins or
 * concurrent admin sessions can confuse cookies/nonces. Within each spec file, tests run
 * in declaration order; cross-file order is not guaranteed (Playwright sorts files by
 * path). All tests inherit the storageState produced by global-setup.
 */

import path from 'path';
import { defineConfig } from '@playwright/test';

const WP_BASE = process.env.WP_BASE || 'http://wordpress';
const ARTIFACT_DIR = process.env.PA_VERIFY_ARTIFACT_DIR || '/tmp/pa-verify';

export default defineConfig( {
	testDir: './tests',
	fullyParallel: false,
	workers: 1,
	// Intentionally 0: this suite is a regression gate, not a flaky-test runner. Silent
	// retries would mask real intermittent breakage (e.g. resize-loop only on second mount).
	retries: 0,
	timeout: 30_000,
	expect: { timeout: 10_000 },
	globalSetup: require.resolve( './global-setup' ),
	outputDir: path.join( ARTIFACT_DIR, 'playwright-output' ),
	reporter: [ [ 'list' ] ],
	use: {
		baseURL: WP_BASE,
		storageState: path.join( ARTIFACT_DIR, 'auth.json' ),
		launchOptions: {
			args: [ '--no-sandbox', '--disable-setuid-sandbox' ],
		},
		screenshot: 'only-on-failure',
		video: 'retain-on-failure',
		trace: 'retain-on-failure',
	},
	projects: [
		{
			name: 'chromium',
			use: { browserName: 'chromium' },
		},
	],
} );
