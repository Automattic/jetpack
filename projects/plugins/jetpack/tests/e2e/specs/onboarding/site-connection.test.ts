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
		await Promise.all( [ onboarding.start(), onboarding.waitForSiteConnection() ] );
	} );

	await test.step( 'Verify site connection', async () => {
		await admin.visitAdminPage( 'admin.php', 'page=my-jetpack' );

		// Find a block which has h2 with text "Connection"
		const h2 = page.getByRole( 'heading', { level: 2, name: 'Connection' } );
		const connectionBlock = h2.locator( 'xpath=..' ); // immediate parent

		await expect( connectionBlock, {
			message: 'Should have the text saying the site is connected.',
		} ).toContainText( 'Site connected.' );

		await expect( connectionBlock.getByRole( 'button', { name: 'Manage' } ), {
			message: 'Should have the "Manage" button.',
		} ).toBeVisible();

		await expect( connectionBlock, {
			message: 'Should have the missing user connection text.',
		} ).toContainText( 'Some features require authentication.' );

		await expect( connectionBlock.getByRole( 'button', { name: 'Sign in' } ), {
			message: 'Should have the user connection button.',
		} ).toBeVisible();
	} );
} );
