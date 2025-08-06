import playwrightConfig from '_jetpack-e2e-commons/playwright.config.mjs';
import { boostPrerequisitesBuilder } from '../../lib/env/prerequisites.js';
import { test, expect } from '../../lib/fixtures/test.ts';

test.describe( 'Image CDN', () => {
	test.beforeAll( async ( { browser } ) => {
		const page = await browser.newPage( playwrightConfig.use );
		await boostPrerequisitesBuilder( page )
			.withCleanEnv()
			.withConnection( true )
			.withSpeedScoreMocked( true )
			.build();
		await page.close();
	} );

	test( 'No Image CDN meta information should show on the admin when the module is inactive', async ( {
		testUtils,
		jetpackBoostPage,
		page,
	} ) => {
		await testUtils.deactivateBoostModule( 'image_cdn' );
		await jetpackBoostPage.visit();

		await expect(
			page.getByRole( 'button', { name: 'Auto-resize lazy images and' } ),
			'Image CDN upgrade section should be visible'
		).toBeHidden();
	} );

	test( 'Image CDN functionality shouldn`t be active when the module is inactive', async ( {
		testUtils,
		page,
	} ) => {
		await testUtils.deactivateBoostModule( 'image_cdn' );
		await boostPrerequisitesBuilder( page ).withAppendedImage( true ).build();
		await page.goto( '/?p=1' );

		expect(
			// The image is added via a helper plugin.
			await page.locator( '#e2e-test-image' ).getAttribute( 'src' ),
			'Image shouldn`t use CDN'
		).not.toMatch( /https:\/\/.*\.wp\.com/ );
	} );

	test( 'Upgrade section should be visible when the module is active', async ( {
		testUtils,
		jetpackBoostPage,
		page,
	} ) => {
		await testUtils.activateBoostModule( 'image_cdn' );
		await jetpackBoostPage.visit();

		await expect(
			page.getByRole( 'button', { name: 'Auto-resize lazy images and' } ),
			'Image CDN upgrade section should be visible'
		).toBeVisible();
	} );

	test( 'Image should be loaded via CDN when Image CDN is active', async ( {
		testUtils,
		page,
	} ) => {
		await testUtils.activateBoostModule( 'image_cdn' );
		await boostPrerequisitesBuilder( page ).withAppendedImage( true ).build();
		await page.goto( '/?p=1' );

		expect(
			// The image is added via a helper plugin.
			await page.locator( '#e2e-test-image' ).getAttribute( 'src' ),
			'Image should use CDN'
		).toMatch( /https:\/\/.*\.wp\.com/ );
	} );
} );
