import { test, expect } from 'jetpack-e2e-commons/fixtures/base-test.js';
import { boostPrerequisitesBuilder } from '../../lib/env/prerequisites.js';
import { JetpackBoostPage, FirstPostPage } from '../../lib/pages/index.js';
import playwrightConfig from 'jetpack-e2e-commons/playwright.config.mjs';

test.describe( 'Image CDN', () => {
	let page;

	test.beforeAll( async ( { browser } ) => {
		page = await browser.newPage( playwrightConfig.use );
		await boostPrerequisitesBuilder( page ).withCleanEnv( true ).withConnection( true ).build();
	} );

	test.afterAll( async () => {} );

	test( 'No Image CDN meta information should show on the admin when the module is inactive', async () => {
		await boostPrerequisitesBuilder( page ).withInactiveModules( [ 'image_cdn' ] ).build();
		const jetpackBoostPage = await JetpackBoostPage.visit( page );

		expect(
			await jetpackBoostPage.isImageCdnUpgradeSectionVisible(),
			'Image CDN upgrade section should not be visible'
		).toBeFalsy();
	} );

	test( 'Image CDN functionality shouldn`t be active when the module is inactive', async () => {
		await boostPrerequisitesBuilder( page )
			.withInactiveModules( [ 'image_cdn' ] )
			.withAppendedImage( true )
			.build();
		const firstPostPage = await FirstPostPage.visit( page );

		expect(
			// The image is added via a helper plugin.
			await firstPostPage.page.locator( '[id="e2e-test-image"]' ).getAttribute( 'src' ),
			'Image shouldn`t use CDN'
		).not.toMatch( /https:\/\/.*\.wp\.com/ );
	} );

	test( 'Upgrade section should be visible when the module is active', async () => {
		await boostPrerequisitesBuilder( page ).withActiveModules( [ 'image_cdn' ] ).build();
		const jetpackBoostPage = await JetpackBoostPage.visit( page );

		expect(
			await jetpackBoostPage.isImageCdnUpgradeSectionVisible(),
			'Image CDN upgrade section should be visible'
		).toBeTruthy();
	} );

	test( 'Image should be loaded via CDN when Image CDN is active', async () => {
		await boostPrerequisitesBuilder( page )
			.withActiveModules( [ 'image_cdn' ] )
			.withAppendedImage( true )
			.build();
		const firstPostPage = await FirstPostPage.visit( page );

		expect(
			// The image is added via a helper plugin.
			await firstPostPage.page.locator( '[id="e2e-test-image"]' ).getAttribute( 'src' ),
			'Image should use CDN'
		).toMatch( /https:\/\/.*\.wp\.com/ );
	} );
} );
