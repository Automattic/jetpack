import { defineConfig, devices } from '@playwright/test';
import { STATE_OFF, STATE_ON } from './helpers/admin-shell-helper';

/*
 * Admin shell regression suite (JETPACK-3406), standalone so it can target any site.
 * Environment variables are documented in README.md § "Admin shell regression suite".
 */
const onUrl = process.env.ADMIN_SHELL_URL ?? 'http://localhost:8889';
const offUrl = process.env.ADMIN_SHELL_OFF_URL;
const stateDir = 'output/admin-shell';

const browsers = [
	{ name: 'chromium', use: devices[ 'Desktop Chrome' ] },
	{ name: 'firefox', use: devices[ 'Desktop Firefox' ] },
	{ name: 'webkit', use: devices[ 'Desktop Safari' ] },
];

export default defineConfig( {
	testDir: './specs/admin-shell',
	outputDir: `${ stateDir }/results`,
	timeout: 180000,
	expect: { timeout: 20000 },
	retries: 0,
	workers: Number( process.env.PLAYWRIGHT_WORKERS ) || 2,
	reporter: [ [ 'list' ], [ 'json', { outputFile: `${ stateDir }/summary.json` } ] ],
	use: {
		viewport: { width: 1280, height: 1600 },
		ignoreHTTPSErrors: true,
		actionTimeout: 20000,
		navigationTimeout: 60000,
		locale: 'en-US',
		screenshot: 'only-on-failure',
		trace: process.env.ADMIN_SHELL_TRACE ? 'retain-on-failure' : 'off',
	},
	projects: [
		{
			name: 'admin shell login',
			testMatch: 'auth.setup.ts',
			use: { baseURL: onUrl },
		},
		...browsers.map( browser => ( {
			name: `shell on: ${ browser.name }`,
			testIgnore: [ 'auth.setup.ts', 'shell-off.test.ts' ],
			dependencies: [ 'admin shell login' ],
			use: {
				...browser.use,
				viewport: { width: 1280, height: 1600 },
				baseURL: onUrl,
				storageState: STATE_ON,
			},
		} ) ),
		...browsers.map( browser => ( {
			name: `shell off: ${ browser.name }`,
			testMatch: 'shell-off.test.ts',
			dependencies: [ 'admin shell login' ],
			use: {
				...browser.use,
				viewport: { width: 1280, height: 1600 },
				baseURL: offUrl ?? onUrl,
				storageState: offUrl ? STATE_OFF : STATE_ON,
			},
		} ) ),
	],
} );
