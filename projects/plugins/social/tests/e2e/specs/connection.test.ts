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
		await expect( page.getByRole( 'button', { name: 'Connect accounts' } ) ).toBeVisible();
		await expect( page.getByRole( 'button', { name: 'Write a post' } ) ).toBeVisible();
	} );
} );
