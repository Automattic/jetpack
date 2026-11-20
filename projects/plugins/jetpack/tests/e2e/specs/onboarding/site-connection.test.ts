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

		await page.getByRole( 'button', { name: 'Connection: Site connected', exact: true } ).click();
		const connectionPopover = page.getByRole( 'dialog', { name: 'Connection', exact: true } );

		await expect( connectionPopover.getByText( 'Not connected', { exact: true } ), {
			message: 'Should show the account is not connected.',
		} ).toBeVisible();

		await expect( connectionPopover, {
			message: 'Should have the missing user connection text.',
		} ).toContainText( 'Connect your account to unlock all the features.' );

		await expect(
			connectionPopover.getByRole( 'link', { name: 'Connect my account', exact: true } ),
			{
				message: 'Should have the user connection link.',
			}
		).toBeVisible();
	} );
} );
