import { expect, test } from '@automattic/_jetpack-e2e-commons/fixtures/base-test';

test.beforeEach( async ( { testUtils } ) => {
	await testUtils.disconnect();
	await testUtils.requestUtils.activatePlugin( 'jetpack-social' );
} );

test( 'Jetpack Social admin page', async ( { page, admin } ) => {
	await admin.visitAdminPage( 'admin.php', 'page=jetpack-social' );
	await expect( page.getByRole( 'heading', { name: 'Jetpack Social' } ) ).toBeVisible();
	await expect( page.getByRole( 'button', { name: 'Get Started' } ) ).toBeVisible();
} );
