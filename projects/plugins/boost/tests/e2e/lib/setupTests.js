import { chromium } from '@playwright/test';
import { prerequisitesBuilder } from 'jetpack-e2e-commons/env/prerequisites.js';
import { boostPrerequisitesBuilder } from './env/prerequisites.js';
import fs from 'fs';

export default async function () {
	const browser = await chromium.launch();
	const page = await browser.newPage();

	// Ugly hack. So often, e2e-mock-speed-score is zero length - force content in there.
	console.log(
		process.cwd() + '/../../../../../tools/docker/wordpress/wp-content/e2e-mock-speed-score-api.php'
	);
	fs.copyFileSync(
		process.cwd() + '/plugins/e2e-mock-speed-score-api.php',
		process.cwd() +
			'/../../../../../tools/docker/wordpress/wp-content/plugins/e2e-mock-speed-score-api.php'
	);

	await prerequisitesBuilder( page )
		.withLoggedIn( true )
		.withActivePlugins( [ 'boost', 'e2e-mock-speed-score-api.php' ] )
		.build();
	await boostPrerequisitesBuilder( page ).withCleanEnv( true ).withConnection( true ).build();
	await page.close();
}
