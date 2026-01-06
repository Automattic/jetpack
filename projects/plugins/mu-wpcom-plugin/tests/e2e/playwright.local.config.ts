import { defineConfig, devices } from '@playwright/test';

export default defineConfig( {
	testDir: './specs',
	timeout: 60000,
	expect: {
		timeout: 10000,
	},
	fullyParallel: false,
	forbidOnly: !! process.env.CI,
	retries: 0,
	workers: 1,
	reporter: 'list',
	use: {
		baseURL: 'http://localhost',
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices[ 'Desktop Chrome' ] },
		},
	],
} );
