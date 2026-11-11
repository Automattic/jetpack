import { test, expect, type Page } from '@playwright/test';
import {
	expectShown,
	installShellProbe,
	openMember,
	submitLogin,
	switchTo,
} from '../../helpers/admin-shell-helper';

/**
 * Log in again in a second tab, which leaves the first tab's REST nonce stale.
 *
 * @param page - Page under test; its context gets the new session.
 */
async function logInAgain( page: Page ): Promise< void > {
	const tab = await page.context().newPage();
	await submitLogin(
		tab,
		process.env.ADMIN_SHELL_USER ?? 'admin',
		process.env.ADMIN_SHELL_PASSWORD ?? 'password'
	);
	await tab.close();
}

/* JETPACK-3673: guests that print wp-api-fetch's inline script used to stack nonce middlewares. */
test.describe( 'Admin shell: stale REST nonce', () => {
	test.beforeEach( async ( { page } ) => {
		await installShellProbe( page );
	} );

	test( 'after My Jetpack → Settings → Jetpack AI, a stale nonce refreshes once', async ( {
		page,
	} ) => {
		await openMember( page, 'my-jetpack' );
		await switchTo( page, 'jetpack-settings' );
		await switchTo( page, 'jetpack-ai' );
		await expectShown( page, 'jetpack-ai' );

		await logInAgain( page );

		let refreshes = 0;
		page.on( 'request', request => {
			if ( /admin-ajax\.php\?(.*&)?action=rest-nonce/.test( request.url() ) ) {
				refreshes++;
			}
		} );
		const result = await page.evaluate( async () => {
			const { apiFetch } = (
				window as unknown as {
					wp: { apiFetch: ( o: { path: string } ) => Promise< { id: number } > };
				}
			 ).wp;
			// A loop never settles, so give up well before the test timeout.
			const timeout = new Promise< string >( resolve =>
				setTimeout( () => resolve( 'still retrying after 15 s' ), 15000 )
			);
			return Promise.race( [
				apiFetch( { path: '/wp/v2/users/me' } ).then(
					user => `user ${ user.id }`,
					( error: { code?: string } ) => `failed: ${ error.code }`
				),
				timeout,
			] );
		} );

		expect( result, 'the request succeeds after the refresh' ).toMatch( /^user \d+$/ );
		expect( refreshes, 'nonce refreshes' ).toBe( 1 );
	} );
} );
