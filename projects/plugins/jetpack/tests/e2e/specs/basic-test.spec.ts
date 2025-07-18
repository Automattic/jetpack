import { expect, test } from '_jetpack-e2e-commons/fixtures/base-test.ts';

test.use( { storageState: process.env.STORAGE_STATE_PATH } );

test.describe( 'Start test', () => {
	test( 'smoke test', async ( { page, admin, requestUtils } ) => {
		await page.goto( 'https://wordpress.com' );

		expect( await page.title() ).toContain( 'WordPress.com' );

		const r = await requestUtils.rest( { path: 'jetpack/v4/connection/check' } );
		console.log( 'Connection check response:', r );

		await admin.visitAdminPage( 'index.php' );

		expect( await page.title() ).toContain( 'Dashboard' );

		await admin.visitAdminPage( 'admin.php', 'page=my-jetpack' );

		expect( await page.title() ).toContain( 'My Jetpack' );

		// Not connected
		await expect( page.getByText( 'Start with Jetpack for free' ) ).toBeVisible();
	} );
} );
