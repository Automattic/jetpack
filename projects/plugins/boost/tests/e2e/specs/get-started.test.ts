import { test, expect } from 'jetpack-e2e-commons/fixtures/base-test.js';
import playwrightConfig from 'jetpack-e2e-commons/playwright.config.cjs';
import { boostPrerequisitesBuilder } from '../lib/env/prerequisites.js';
import { JetpackBoostPage } from '../lib/pages/index.js';

let jetpackBoostPage;

test.describe( 'Getting started page', () => {
	test.beforeAll( async ( { browser } ) => {
		const page = await browser.newPage( playwrightConfig.use );
		await boostPrerequisitesBuilder( page )
			.withCleanEnv()
			.withConnection( true )
			.withGetStarted( true )
			.build();
	} );

	test.afterAll( async ( { browser } ) => {
		const page = await browser.newPage();
		await boostPrerequisitesBuilder( page )
			.withCleanEnv()
			.withConnection( true )
			.withGetStarted( false )
			.build();
		await page.close();
	} );

	test.beforeEach( async function ( { page } ) {
		jetpackBoostPage = await JetpackBoostPage.visit( page );
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
		await jetpackBoostPage.click( 'text="Get Boost"' );
		await jetpackBoostPage.page.waitForNavigation();
		const expectedUrlPattern = /https:\/\/wordpress.com\/.*checkout.*/;
		expect(
			expectedUrlPattern.test( await jetpackBoostPage.page.url() ),
			'User should be redirected to checkout page'
		).toBeTruthy();
	} );

	test( 'User should be able to get started with the free plan', async () => {
		await jetpackBoostPage.click( 'text="Start for free"' );
		expect( await jetpackBoostPage.isScoreVisible(), 'Score should be visible' ).toBeTruthy();
	} );
} );
