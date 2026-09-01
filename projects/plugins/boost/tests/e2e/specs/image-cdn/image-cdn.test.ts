import { test, expect } from '../../lib/fixtures/test';
import playwrightConfig from '../../playwright.config';

test.describe( 'Image CDN', () => {
	test.beforeAll( async ( { browser, boostUtils } ) => {
		const page = await browser.newPage( playwrightConfig.use );
		await boostUtils.resetEnvironment();
		await boostUtils.connectIfNeeded( page );
		await page.close();
		await boostUtils.mockSpeedScore();
	} );

	test.afterAll( async ( { boostUtils } ) => {
		await boostUtils.unMockSpeedScore();
	} );

	test( 'No Image CDN meta information should show on the admin when the module is inactive', async ( {
		boostUtils,
		jetpackBoostPage,
		page,
	} ) => {
		await boostUtils.deactivateBoostModule( 'image_cdn' );
		await jetpackBoostPage.visit();

		await expect(
			page.getByRole( 'button', { name: 'Auto-resize lazy images and' } ),
			'Image CDN upgrade section should be visible'
		).toBeHidden();
	} );

	test( 'Image CDN functionality shouldn`t be active when the module is inactive', async ( {
		boostUtils,
		page,
	} ) => {
		await boostUtils.deactivateBoostModule( 'image_cdn' );
		await boostUtils.executeWpCommand(
			'plugin activate e2e-appended-image/e2e-appended-image.php'
		);
		await page.goto( '/?p=1' );

		expect(
			// The image is added via a helper plugin.
			await page.locator( '#e2e-test-image' ).getAttribute( 'src' ),
			'Image shouldn`t use CDN'
		).not.toMatch( /https:\/\/.*\.wp\.com/ );
	} );

	test( 'Upgrade section should be visible when the module is active', async ( {
		boostUtils,
		jetpackBoostPage,
		page,
	} ) => {
		await boostUtils.activateBoostModule( 'image_cdn' );
		await jetpackBoostPage.visit();

		await expect(
			page.getByRole( 'button', { name: 'Auto-resize lazy images and' } ),
			'Image CDN upgrade section should be visible'
		).toBeVisible();
	} );

	test( 'Image should be loaded via CDN when Image CDN is active', async ( {
		boostUtils,
		page,
	} ) => {
		await boostUtils.activateBoostModule( 'image_cdn' );
		await boostUtils.executeWpCommand(
			'plugin activate e2e-appended-image/e2e-appended-image.php'
		);
		await page.goto( '/?p=1' );

		expect(
			// The image is added via a helper plugin.
			await page.locator( '#e2e-test-image' ).getAttribute( 'src' ),
			'Image should use CDN'
		).toMatch( /https:\/\/.*\.wp\.com/ );
	} );
} );
