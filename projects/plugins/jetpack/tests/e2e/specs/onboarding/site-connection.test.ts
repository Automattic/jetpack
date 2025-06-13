import { prerequisitesBuilder } from '_jetpack-e2e-commons/env/index.js';
import { test, expect } from '_jetpack-e2e-commons/fixtures/base-test.js';
import { Onboarding } from '_jetpack-e2e-commons/flows/onboarding.ts';

test.beforeEach( async ( { page, admin } ) => {
	await prerequisitesBuilder( page ).withCleanEnv().withLoggedIn( true ).build();

	await admin.visitAdminPage( 'admin.php', 'page=my-jetpack' );
} );

test( 'Site only connection', async ( { page, admin } ) => {
	const onboarding = new Onboarding( page );

	await test.step( 'Connect site', async () => {
		const siteConnectionPromise = onboarding.waitForSiteConnection();
		await onboarding.start();
		await siteConnectionPromise;
		await onboarding.waitForRedirectToWpcom();
	} );

	await test.step( 'Verify site connection', async () => {
		await admin.visitAdminPage( 'admin.php', 'page=my-jetpack' );

		// Find a block which has h2 with text "Connection"
		const h3 = page.getByRole( 'heading', { level: 3, name: 'Connection' } );
		const connectionBlock = h3.locator( 'xpath=..' ); // immediate parent

		await expect( connectionBlock, {
			message: 'Should have the text saying the site is connected.',
		} ).toContainText( 'Site connected' );

		await expect( connectionBlock.getByRole( 'button', { name: 'Site connected' } ), {
			message: '"Site connected" should be a button.',
		} ).toBeVisible();

		await expect( connectionBlock, {
			message: 'Should have the missing user connection text.',
		} ).toContainText( 'Connect your account to unlock all the features.' );

		await expect( connectionBlock.getByRole( 'button', { name: 'Connect my account' } ), {
			message: 'Should have the user connection button.',
		} ).toBeVisible();
	} );
} );
