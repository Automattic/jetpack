import { expect, test } from '@automattic/_jetpack-e2e-commons/fixtures/base-test';
import { Onboarding } from '../helpers/onboarding';

test.beforeAll( async ( { testUtils } ) => {
	await testUtils.disconnect();
	await testUtils.executeWpCommand( 'option delete jetpack-social_show_pricing_page' );
	await testUtils.requestUtils.deactivatePlugin( 'jetpack' );
	await testUtils.requestUtils.activatePlugin( 'jetpack-social' );
} );

test( 'Jetpack Social connection', async ( { page, admin, requestUtils } ) => {
	const onboarding = new Onboarding( page );

	await test.step( 'Connect wordpress.com account to Jetpack Social', async () => {
		await onboarding.connect( {
			admin,
			baseURL: requestUtils.baseURL!,
		} );
	} );

	await test.step( 'Verify connection in Jetpack Social page', async () => {
		// The modernized dashboard lands on the Overview tab with no social
		// accounts connected yet, so assert on its empty state and the
		// "Add account" header CTA (rendered twice — header + empty state).
		await expect(
			page.getByRole( 'heading', { name: 'No accounts connected yet' } )
		).toBeVisible();
		await expect( page.getByRole( 'button', { name: 'Add account' } ).first() ).toBeVisible();
	} );
} );
