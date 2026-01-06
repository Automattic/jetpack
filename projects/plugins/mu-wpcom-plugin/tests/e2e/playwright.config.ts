import { defineConfig, devices } from '@playwright/test';
import config from 'config';

const baseURL = process.env.WP_BASE_URL || 'http://localhost';

export default defineConfig( {
	testDir: './specs',
	timeout: 60000,
	expect: {
		timeout: 10000,
	},
	fullyParallel: false,
	forbidOnly: !! process.env.CI,
	retries: process.env.CI ? 1 : 0,
	workers: 1,
	reporter: [
		[ 'list' ],
		[ 'json', { outputFile: `${ config.get( 'dirs.output' ) }/summary.json` } ],
	],
	use: {
		baseURL,
		trace: 'retain-on-failure',
		screenshot: 'only-on-failure',
		video: 'retain-on-failure',
	},
	projects: [
		{
			name: 'mu-wpcom-plugin e2e',
			use: { ...devices[ 'Desktop Chrome' ] },
		},
	],
} );
