import { test as setup, expect } from '@automattic/_jetpack-e2e-commons/fixtures/base-test';

// The shared auth setup also signs in to WordPress.com, which this suite never needs.
setup( 'authenticate the local admin', async ( { testUtils, browser } ) => {
	await testUtils.authenticateUser( testUtils, testUtils.getSiteCredentials() );

	const context = await browser.newContext( { storageState: process.env.STORAGE_STATE_PATH } );
	const response = await context.request.get( './wp-admin/profile.php' );
	expect( response.url(), 'Local admin should not be sent to the login page' ).not.toContain(
		'wp-login.php'
	);
	await context.close();
} );
