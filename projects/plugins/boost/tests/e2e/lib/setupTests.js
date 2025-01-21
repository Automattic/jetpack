import { prerequisitesBuilder } from '@automattic/jetpack-e2e-commons/env/prerequisites.js';
import { chromium } from '@playwright/test';
import { boostPrerequisitesBuilder } from './env/prerequisites.js';

/**
 * Setup tests.
 */
export default async function () {
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
