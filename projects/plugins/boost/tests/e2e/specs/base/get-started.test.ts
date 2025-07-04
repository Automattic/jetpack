import { test, expect } from '_jetpack-e2e-commons/fixtures/base-test.js';
import playwrightConfig from '_jetpack-e2e-commons/playwright.config.mjs';
import { boostPrerequisitesBuilder } from '../../lib/env/prerequisites.js';
import { JetpackBoostPage } from '../../lib/pages/index.js';

test.describe( 'Getting started page', () => {
	let page;
	let jetpackBoostPage;

	test.beforeEach( async ( { browser } ) => {
		page = await browser.newPage( playwrightConfig.use );
		await boostPrerequisitesBuilder( page ).withCleanEnv().withConnection( false ).build();

		jetpackBoostPage = await JetpackBoostPage.visit( page );
	} );

	test.afterEach( async () => {
		await page.close();
	} );

	test( 'User should see the getting started pricing table', async () => {
		expect(
			await jetpackBoostPage.isElementVisible( 'text="Get Boost"' ),
			'Premium CTA should be visible'
		).toBe( true );
		expect(
			await jetpackBoostPage.isElementVisible( 'text="Start for free"' ),
			'Free CTA should be visible'
		).toBe( true );
	} );

	test( 'User should be able to purchase the premium plan', async () => {
		const expectedUrlPattern = /https:\/\/wordpress.com\/.*checkout.*/;

		const navigation = jetpackBoostPage.page.waitForNavigation( {
			url: expectedUrlPattern,
			timeout: 180000,
		} );
		await jetpackBoostPage.click( 'text="Get Boost"' );
		await navigation;

		expect(
			expectedUrlPattern.test( jetpackBoostPage.page.url() ),
			'User should be redirected to checkout page'
		).toBeTruthy();
	} );

	test( 'User should be able to get started with the free plan', async () => {
		const navigation = jetpackBoostPage.page.waitForNavigation( { timeout: 180000 } );
		await jetpackBoostPage.click( 'text="Start for free"' );
		await navigation;

		await jetpackBoostPage.waitForScoreLoadingToFinish();
		expect( await jetpackBoostPage.isScoreVisible(), 'Score should be visible' ).toBeTruthy();
	} );
} );
