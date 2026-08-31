import { test, expect } from '../../lib/fixtures/test';

test.describe( 'Image Guide', () => {
	test.beforeAll( async ( { boostUtils } ) => {
		await boostUtils.resetEnvironment();
		await boostUtils.mockConnection();
		await boostUtils.mockSpeedScore();
	} );

	test.afterAll( async ( { boostUtils } ) => {
		await boostUtils.unMockConnection();
		await boostUtils.unMockSpeedScore();
	} );

	test( 'Image Guide functionality shouldn`t be active when the module is inactive', async ( {
		boostUtils,
		page,
	} ) => {
		await boostUtils.deactivateBoostModule( 'image_guide' );
		await page.goto( '/?p=1' );

		await expect(
			page.locator( '#jetpack-boost-guide-js' ),
			'Image Guide script shouldn`t be present'
		).toHaveCount( 0 );
	} );

	test( 'Image Guide functionality should be active when the module is active', async ( {
		boostUtils,
		page,
	} ) => {
		await boostUtils.activateBoostModule( 'image_guide' );
		await boostUtils.executeWpCommand(
			'plugin activate e2e-appended-image/e2e-appended-image.php'
		);
		await page.goto( '/?p=1' );

		await expect(
			page.locator( '#jetpack-boost-guide-js' ).first(),
			'Image Guide script should be present'
		).toBeAttached();

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
