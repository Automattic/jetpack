import { test, expect } from '_jetpack-e2e-commons/fixtures/base-test.ts';
import { connect } from '../helpers/index.js';

test.beforeAll( async ( { testUtils } ) => {
	await testUtils.disconnect();
	await testUtils.executeWpCommand( 'option delete jetpack-social_show_pricing_page' );
	await testUtils.requestUtils.deactivatePlugin( 'jetpack' );
	await testUtils.requestUtils.activatePlugin( 'jetpack-social' );
} );

test( 'Jetpack Social connection', async ( { page, admin } ) => {
	await test.step( 'Connect wordpress.com account to Jetpack Social', async () => {
		await connect( page );
	} );

	await test.step( 'Verify connection in Jetpack Social page', async () => {
		await admin.visitAdminPage( 'admin.php?page=jetpack-social' );

		await expect( page.getByRole( 'button', { name: 'Connect accounts' } ) ).toBeVisible();
		await expect( page.getByRole( 'link', { name: 'Write a post' } ) ).toBeVisible();
	} );
} );
