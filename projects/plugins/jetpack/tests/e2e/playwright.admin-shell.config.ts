import { defineConfig, devices, type ReporterDescription } from '@playwright/test';
import { STATE_OFF, STATE_ON, STATE_STANDALONE } from './helpers/admin-shell-helper';

/*
 * Admin shell regression suite (JETPACK-3406), standalone so it can target any site.
 * Environment variables are documented in README.md § "Admin shell regression suite".
 */
const onUrl = process.env.ADMIN_SHELL_URL ?? 'http://localhost:8889';
const offUrl = process.env.ADMIN_SHELL_OFF_URL;
const standaloneUrl = process.env.ADMIN_SHELL_STANDALONE_URL;
const stateDir = 'output/admin-shell';
// Separate runs against one site (shell on, then off) each need their own results.
const runDir = process.env.ADMIN_SHELL_RUN
	? `${ stateDir }/${ process.env.ADMIN_SHELL_RUN }`
	: stateDir;

const reporter: ReporterDescription[] = [
	[ 'list' ],
	[ 'json', { outputFile: `${ runDir }/summary.json` } ],
];
// Same CI reporters as tools/e2e-commons/playwright.config.default.ts: the shared CTRF report and PR annotations.
if ( process.env.CI ) {
	reporter.push(
		[
			'playwright-ctrf-json-reporter',
			{
				outputDir: runDir,
				outputFile: `ctrf-report-${ Date.now() }.json`,
				branchName: process.env.GITHUB_REF_NAME || '',
				commit: process.env.GITHUB_SHA || '',
				appName: 'jetpack',
				repositoryName: process.env.GITHUB_REPOSITORY || '',
			},
		],
		[ 'github' ]
	);
}

const browsers = [
	{ name: 'chromium', use: devices[ 'Desktop Chrome' ] },
	{ name: 'firefox', use: devices[ 'Desktop Firefox' ] },
	{ name: 'webkit', use: devices[ 'Desktop Safari' ] },
];

export default defineConfig( {
	testDir: './specs/admin-shell',
	outputDir: `${ runDir }/results`,
	timeout: 180000,
	expect: { timeout: 20000 },
	// Only login and tests wrapped in intermittentSpikeBug() retry; any other flake fails the run.
	retries: 0,
	workers: Number( process.env.PLAYWRIGHT_WORKERS ) || 2,
	reporter,
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
			grepInvert: /standalone-only/,
			retries: 2,
			use: { baseURL: onUrl },
		},
		// Its own login, so a standalone-only run needs no shell-on site.
		{
			name: 'standalone login',
			testMatch: 'auth.setup.ts',
			grep: /standalone-only/,
			retries: 2,
		},
		...browsers.map( browser => ( {
			name: `shell on: ${ browser.name }`,
			testIgnore: [ 'auth.setup.ts', 'shell-off.test.ts', 'standalone.test.ts' ],
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
		// Only with ADMIN_SHELL_STANDALONE_URL: a site without the Jetpack plugin (JETPACK-3419).
		...( standaloneUrl ? browsers : [] ).map( browser => ( {
			name: `standalone: ${ browser.name }`,
			testMatch: 'standalone.test.ts',
			dependencies: [ 'standalone login' ],
			use: {
				...browser.use,
				viewport: { width: 1280, height: 1600 },
				baseURL: standaloneUrl,
				storageState: STATE_STANDALONE,
			},
		} ) ),
	],
} );
