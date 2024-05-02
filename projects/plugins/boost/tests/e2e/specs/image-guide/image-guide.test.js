import { test, expect } from 'jetpack-e2e-commons/fixtures/base-test.js';
import { boostPrerequisitesBuilder } from '../../lib/env/prerequisites.js';
import { FirstPostPage } from '../../lib/pages/index.js';
import playwrightConfig from 'jetpack-e2e-commons/playwright.config.mjs';

test.describe( 'Image CDN', () => {
	let page;

	test.beforeAll( async ( { browser } ) => {
		page = await browser.newPage( playwrightConfig.use );
		await boostPrerequisitesBuilder( page ).withCleanEnv( true ).withConnection( true ).build();
	} );

	test.afterAll( async () => {} );

	test( 'Image Guide functionality shouldn`t be active when the module is inactive', async () => {
		await boostPrerequisitesBuilder( page ).withInactiveModules( [ 'image_guide' ] ).build();
		const firstPostPage = await FirstPostPage.visit( page );

		expect(
			await firstPostPage.isImageGuideScriptPresent(),
			'Image Guide script shouldn`t be present'
		).toBeFalsy();
	} );

	test( 'Image Guide functionality should be active when the module is active', async () => {
		await boostPrerequisitesBuilder( page )
			.withActiveModules( [ 'image_guide' ] )
			.withAppendedImage( true )
			.build();
		const firstPostPage = await FirstPostPage.visit( page );

		expect(
			await firstPostPage.isImageGuideScriptPresent(),
			'Image Guide script should be present'
		).toBeTruthy();

		expect(
			await firstPostPage.isImageGuideAdminBarItemPresent(),
			'Image Guide admin bar item should be present'
		).toBeTruthy();

		console.log( await firstPostPage.isImageGuideUIPresent() );

		expect(
			await firstPostPage.isImageGuideUIPresent(),
			'Image Guide UI item should be present'
		).toBeTruthy();
	} );
} );
