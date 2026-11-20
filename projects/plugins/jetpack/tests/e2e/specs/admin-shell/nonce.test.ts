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

		/* Count from the new login on. Background requests can hit the stale nonce too, each refreshing it
		 * once, so count the probe's own tries: a stale one and one retry, not a loop. */
		let refreshes = 0;
		let probeTries = 0;
		page.on( 'request', request => {
			if ( /admin-ajax\.php\?(.*&)?action=rest-nonce/.test( request.url() ) ) {
				refreshes++;
			} else if ( request.url().includes( 'e2e_nonce_probe' ) ) {
				probeTries++;
			}
		} );
		await logInAgain( page );
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
				apiFetch( { path: '/wp/v2/users/me?e2e_nonce_probe=1' } ).then(
					user => `user ${ user.id }`,
					( error: { code?: string } ) => `failed: ${ error.code }`
				),
				timeout,
			] );
		} );

		expect( result, 'the request succeeds after the refresh' ).toMatch( /^user \d+$/ );
		expect( refreshes, 'nonce refreshes' ).toBeGreaterThan( 0 );
		expect( probeTries, 'tries of the probe request' ).toBeLessThanOrEqual( 2 );
	} );
} );
