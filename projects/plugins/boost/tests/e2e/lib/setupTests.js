import { chromium } from '@playwright/test';
import { prerequisitesBuilder } from 'jetpack-e2e-commons/env/prerequisites.js';
import { boostPrerequisitesBuilder } from './env/prerequisites.js';

export default async function () {
	const browser = await chromium.launch();
	const page = await browser.newPage();
	await prerequisitesBuilder( page )
		.withLoggedIn( true )
		.withActivePlugins( [ 'boost' ] )
		.withInactivePlugins( [ 'jetpack' ] )
		.build();
	await boostPrerequisitesBuilder( page )
		.withCleanEnv( true )
		.withSpeedScoreMocked( true )
		.withConnection( true )
		.build();
	await page.close();
}
