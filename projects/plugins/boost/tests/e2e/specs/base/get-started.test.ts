import playwrightConfig from '_jetpack-e2e-commons/playwright.config.mjs';
import { boostPrerequisitesBuilder } from '../../lib/env/prerequisites.js';
import { test, expect } from '../../lib/fixtures/test.ts';

test.describe( 'Getting started page', () => {
	test.beforeEach( async ( { browser } ) => {
		const page = await browser.newPage( playwrightConfig.use );
		await boostPrerequisitesBuilder( page )
			.withCleanEnv()
			.withConnection( false )
			.withSpeedScoreMocked( true )
			.build();

		await page.close();
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.visitAdminPage( 'admin.php', 'page=jetpack-boost' );
	} );

	test( 'User should see the getting started pricing table', async ( { page } ) => {
		await expect(
			page.getByRole( 'button', { name: 'Get Boost' } ),
			'Premium CTA should be visible'
		).toBeVisible();
		await expect(
			page.getByRole( 'button', { name: 'Start for free' } ),
			'Free CTA should be visible'
		).toBeVisible();
	} );

	test( 'User should be able to purchase the premium plan', async ( { page } ) => {
		const expectedUrlPattern = /https:\/\/wordpress.com\/.*checkout.*/;

		await page.getByRole( 'button', { name: 'Get Boost' } ).click();

		await expect( page, 'User should be redirected to checkout page' ).toHaveURL(
			expectedUrlPattern,
			{
				timeout: 60000,
			}
		);
	} );

	test( 'User should be able to get started with the free plan', async ( {
		page,
		jetpackBoostPage,
	} ) => {
		await page.getByRole( 'button', { name: 'Start for free' } ).click();
		await expect( page ).toHaveURL( /page=jetpack-boost(?:#\/)?$/, { timeout: 180000 } );

		// await jetpackBoostPage.waitForScoreLoadingToFinish();
		await jetpackBoostPage.expectScoreToBeVisible();
	} );
} );
