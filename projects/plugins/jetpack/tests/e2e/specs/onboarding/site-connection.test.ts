import { test, expect } from '@automattic/_jetpack-e2e-commons/fixtures/base-test';
import { Onboarding } from '../../helpers/onboarding';

test.beforeEach( async ( { testUtils } ) => {
	await testUtils.disconnect();

	expect( await testUtils.isUserConnected() ).toBe( false );
	expect( await testUtils.isSiteConnected() ).toBe( false );
} );

test( 'Site only connection', async ( { page, admin } ) => {
	await admin.visitAdminPage( 'admin.php', 'page=my-jetpack' );

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
