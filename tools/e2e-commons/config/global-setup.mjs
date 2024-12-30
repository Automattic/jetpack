import { request } from '@playwright/test';
import { RequestUtils } from '@wordpress/e2e-test-utils-playwright';

/**
 * Global setup for Playwright tests.
 *
 * Copied from https://github.com/WordPress/gutenberg/blob/b4304f8bf6bd9b890b4108adcc326cd586a3ab4e/packages/scripts/config/playwright/global-setup.js
 *
 * @param {import('@playwright/test').PlaywrightTestConfig} config - Playwright test configuration.
 */
async function globalSetup( config ) {
	const { storageState, baseURL } = config.projects[ 0 ].use;
	const storageStatePath = typeof storageState === 'string' ? storageState : undefined;

	const requestContext = await request.newContext( {
		baseURL,
	} );

	const requestUtils = new RequestUtils( requestContext, {
		storageStatePath,
	} );

	// Authenticate and save the storageState to disk.
	await requestUtils.setupRest();

	await requestContext.dispose();
}

export default globalSetup;
