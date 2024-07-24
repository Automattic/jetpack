import { execSync } from 'child_process';
import { setup as setupPuppeteer } from 'jest-environment-puppeteer';

/**
 * Global setup function for Jest tests.
 *
 * @param {import('jest').GlobalConfig} globalConfig - Jest's global configuration object
 */
export default async function globalSetup( globalConfig ) {
	// Install Chrome for Puppeteer
	execSync( 'npx puppeteer browsers install chrome', { stdio: 'inherit' } );

	// Run the original setup from jest-environment-puppeteer
	await setupPuppeteer( globalConfig );
}
