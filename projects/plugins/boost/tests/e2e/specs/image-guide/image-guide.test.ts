import { boostPrerequisitesBuilder } from '../../lib/env/prerequisites.js';
import { test, expect } from '../../lib/fixtures/test.ts';
import playwrightConfig from '../../playwright.config.ts';

test.describe( 'Image CDN', () => {
	test.beforeAll( async ( { browser } ) => {
		const page = await browser.newPage( playwrightConfig.use );
		await boostPrerequisitesBuilder( page )
			.withCleanEnv()
			.withMockConnection( true )
			.withSpeedScoreMocked( true )
			.build();
		await page.close();
	} );

	test( 'Image Guide functionality shouldn`t be active when the module is inactive', async ( {
		testUtils,
		page,
	} ) => {
		await testUtils.deactivateBoostModule( 'image_guide' );
		await page.goto( '/?p=1' );

		await expect(
			page.locator( '#jetpack-boost-guide-js' ),
			'Image Guide script shouldn`t be present'
		).toHaveCount( 0 );
	} );

	test( 'Image Guide functionality should be active when the module is active', async ( {
		testUtils,
		page,
	} ) => {
		await testUtils.activateBoostModule( 'image_guide' );
		await boostPrerequisitesBuilder( page ).withAppendedImage( true ).build();
		await page.goto( '/?p=1' );

		await expect( async () => {
			const count = await page.locator( '#jetpack-boost-guide-js' ).count();
			expect( count, 'Image Guide script should be present' ).toBeGreaterThan( 0 );
		} ).toPass( { timeout: 10000 } );

		await expect(
			page.locator( '#wp-toolbar #jetpack-boost-guide-bar' ),
			'Image Guide admin bar item should be present'
		).toBeVisible();

		await expect(
			page.locator( '.jetpack-boost-guide > .guide' ),
			'Image Guide UI item should be present'
		).toBeVisible();
	} );
} );
