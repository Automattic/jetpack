import { chromium } from '@playwright/test';
import globalSetup from '_jetpack-e2e-commons/config/global-setup.mjs';
import { prerequisitesBuilder } from '_jetpack-e2e-commons/env/prerequisites.js';
import { boostPrerequisitesBuilder } from './env/prerequisites.js';

/**
 * Setup tests.
 * @param {import('@playwright/test').PlaywrightTestConfig} config - Playwright test configuration.
 */
export default async function ( config ) {
	await globalSetup( config );

	const browser = await chromium.launch();
	const page = await browser.newPage();
	await prerequisitesBuilder( page ).withLoggedIn( true ).withActivePlugins( [ 'boost' ] ).build();
	await boostPrerequisitesBuilder( page )
		.withCleanEnv( true )
		.withSpeedScoreMocked( true )
		.withConnection( true )
		.build();
	await page.close();
}
