import fs from 'fs';
import { fileURLToPath } from 'url';
import { defineConfig, devices, type ReporterDescription } from '@playwright/test';
import config from 'config';
import logger from './logger';
import { resolveSiteUrl } from './utils/environment';

const rootPath = fileURLToPath( new URL( '.', import.meta.url ) );

const reporter: ReporterDescription[] = [
	[ 'list' ],
	[ 'json', { outputFile: `${ config.get( 'dirs.output' ) }/summary.json` } ],
	[
		'allure-playwright',
		{
			suiteTitle: false,
		},
	],
	[
		'junit',
		{
			outputFile: `${ config.get( 'dirs.output' ) }/results.xml`,
			stripANSIControlSequences: true,
			includeProjectInTestName: true,
		},
	],
	[
		'playwright-ctrf-json-reporter',
		{
			outputDir: `${ config.get( 'dirs.output' ) }`,
			outputFile: `ctrf-report-${ Date.now() }.json`,
			branchName: process.env.GITHUB_REF_NAME || '',
			commit: process.env.GITHUB_SHA || '',
			appName: 'jetpack',
			repositoryName: process.env.GITHUB_REPOSITORY || '',
		},
	],
];

if ( process.env.CI ) {
	reporter.push( [ 'github' ], [ `${ rootPath }/reporters/flaky-tests-reporter.ts` ] );
}

process.env.STORAGE_STATE_DIR_PATH = `${ rootPath }/.state`.replaceAll( '//', '/' );
process.env.STORAGE_STATE_PATH = `${ process.env.STORAGE_STATE_DIR_PATH }/storage-state.json`;

// Fail early if the required test site config is not defined
// Let config lib throw by using get function on an undefined property
if ( process.env.TEST_SITE ) {
	config.get< { get( key: string ): unknown } >( 'testSites' ).get( process.env.TEST_SITE );
}

// Create the temp config dir used to store all kinds of temp config stuff
// This is needed because writeFileSync doesn't create parent dirs and will fail
fs.mkdirSync( config.get< string >( 'dirs.temp' ), { recursive: true } );

const resolvedBaseURL = resolveSiteUrl();

// Ensure the environment variables for `@wordpress/e2e-test-utils-playwright` are set
const testSite = process.env.TEST_SITE ? process.env.TEST_SITE : 'default';
logger.debug( `Using '${ testSite }' test site config` );
const site = config.get< { username: string; password: string } >( `testSites.${ testSite }` );

process.env.WP_BASE_URL = resolvedBaseURL;
process.env.WP_USERNAME = site.username;
process.env.WP_PASSWORD = site.password;

export const setupProjects = [
	{
		name: 'environment check',
		testDir: `${ rootPath }/setup-specs`,
		testMatch: 'env-check.setup.ts',
		storageState: undefined,
	},
	{
		name: 'global authentication',
		testDir: `${ rootPath }/setup-specs`,
		testMatch: 'auth.setup.ts',
		dependencies: [ 'environment check' ],
		storageState: undefined,
	},
	{
		name: 'connection setup',
		testDir: `${ rootPath }/setup-specs`,
		testMatch: 'connection.setup.ts',
		dependencies: [ 'global authentication' ],
	},
];

const defaultWorkers = Number( process.env.PLAYWRIGHT_WORKERS ) || 1;

const playwrightConfig = defineConfig( {
	timeout: 300000,
	expect: {
		timeout: 20000,
	},
	retries: process.env.CI ? 1 : 0,
	workers: defaultWorkers,
	outputDir: config.get< string >( 'dirs.results' ),
	reporter,
	forbidOnly: !! process.env.CI,
	use: {
		...devices[ 'Desktop Chrome' ],
		baseURL: resolvedBaseURL,
		headless: true,
		viewport: { width: 1280, height: 1600 },
		ignoreHTTPSErrors: true,
		actionTimeout: 20000,
		screenshot: {
			mode: 'only-on-failure',
			fullPage: true,
		},
		video: 'retain-on-failure',
		trace: process.env.CI ? 'off' : 'retain-on-failure',
		userAgent:
			'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36 wp-e2e-tests',
		locale: 'en-US',
		contextOptions: {
			reducedMotion: 'reduce',
			// TODO - Enable strictSelectors once all tests are updated.
			// strictSelectors: true,
		},
		storageState: fs.existsSync( process.env.STORAGE_STATE_PATH )
			? process.env.STORAGE_STATE_PATH
			: undefined,
	},
	reportSlowTests: null,
} );

export default playwrightConfig;
