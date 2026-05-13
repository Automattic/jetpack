import { test as setup, expect } from '../fixtures/base-test';
import { getCIProjectNameTestTag } from '../utils/formatting';

setup(
	'authenticate users',
	{ tag: [ getCIProjectNameTestTag() ] },
	async ( { testUtils, browser } ) => {
		const localCredentials = testUtils.getSiteCredentials();
		const dotComCredentials = testUtils.getDotComCredentials();

		await setup.step( 'authenticate local user', async () => {
			await testUtils.authenticateUser( testUtils, localCredentials );
		} );

		await setup.step( 'authenticate wordpress.com user', async () => {
			await testUtils.authenticateUser( testUtils, dotComCredentials, {
				siteUrl: 'https://wordpress.com',
			} );
		} );

		// Create new request context with saved storage state for verification
		const { STORAGE_STATE_PATH } = process.env;
		const authenticatedContext = await browser.newContext( { storageState: STORAGE_STATE_PATH } );

		await setup.step( 'verify local user authentication', async () => {
			const r = await authenticatedContext.request.get( './wp-admin/profile.php' );
			expect
				.soft( r.url(), 'User is not redirected to login page' )
				.not.toContain( 'wp-login.php' );
			expect
				.soft( await r.text(), 'User is redirected to profile page' )
				.toContain( `Howdy, ${ localCredentials.username }` );
		} );

		await setup.step( 'verify wordpress.com user authentication', async () => {
			// use the browser to ensure JS routing is executed
			const page = await authenticatedContext.newPage();
			await page.goto( 'https://wordpress.com/me', { waitUntil: 'load' } );

			await expect
				.soft( page, 'User remains on an authenticated WordPress.com page' )
				.toHaveURL( /wordpress\.com\/me/ );

			await expect
				.soft(
					page.getByRole( 'link', { name: /log in/i } ),
					'Login link should not be visible for authenticated user'
				)
				.toHaveCount( 0 );
		} );
	}
);
