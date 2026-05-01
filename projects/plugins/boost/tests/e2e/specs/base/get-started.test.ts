import { test, expect } from '../../lib/fixtures/test';

test.describe( 'Getting started page', () => {
	test.beforeEach( async ( { boostUtils, jetpackBoostPage } ) => {
		await boostUtils.resetEnvironment();
		await jetpackBoostPage.visit();
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
		boostUtils,
	} ) => {
		await boostUtils.mockSpeedScore();

		await page.getByRole( 'button', { name: 'Start for free' } ).click();
		await expect( page ).toHaveURL( /page=jetpack-boost(?:#\/)?$/, { timeout: 180000 } );

		await jetpackBoostPage.expectScoreToBeVisible();

		await boostUtils.unMockSpeedScore();
	} );
} );
