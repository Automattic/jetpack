import { test, expect, type Page } from '@playwright/test';
import { installShellProbe, openMember, switchTo } from '../../helpers/admin-shell-helper';

const FORMS = 'jetpack-forms-responses-wp-admin';

/* Only the probe request is answered as stale, so the app's own requests can't add refreshes. */
const PROBE = '_jp_shell_nonce_probe';
const FRESH = 'e2e-fresh-nonce';

/* The member loaded first, then each one switched to. The first row is a plain page load. */
const TOURS = [
	[ 'my-jetpack' ],
	[ 'my-jetpack', FORMS ],
	[ FORMS, 'my-jetpack' ],
	[ 'my-jetpack', FORMS, 'my-jetpack', FORMS ],
];

type ApiFetchWindow = {
	wp: {
		apiFetch: ( ( options: { path: string } ) => Promise< unknown > ) & {
			nonceMiddleware: { nonce: string };
		};
	};
};

/**
 * Make the page's nonce stale: the server refuses it, and accepts only what the refresh hands out.
 *
 * @param page - Page under test.
 * @return Getter for how many nonce refreshes the page has made.
 */
async function routeStaleNonce( page: Page ): Promise< () => number > {
	const realNonce = await page.evaluate(
		() => ( window as unknown as ApiFetchWindow ).wp.apiFetch.nonceMiddleware.nonce
	);
	let refreshes = 0;
	await page.route( /admin-ajax\.php\?action=rest-nonce/, route => {
		refreshes++;
		return route.fulfill( { status: 200, contentType: 'text/plain', body: FRESH } );
	} );
	await page.route(
		url => url.searchParams.has( PROBE ),
		route => {
			const headers = route.request().headers();
			if ( headers[ 'x-wp-nonce' ] === FRESH ) {
				return route.continue( { headers: { ...headers, 'x-wp-nonce': realNonce } } );
			}
			return route.fulfill( {
				status: 403,
				contentType: 'application/json',
				body: JSON.stringify( {
					code: 'rest_cookie_invalid_nonce',
					message: 'Cookie check failed',
					data: { status: 403 },
				} ),
			} );
		}
	);
	return () => refreshes;
}

test.describe( 'Admin shell: a stale REST nonce', () => {
	test.beforeEach( async ( { page } ) => {
		await installShellProbe( page );
	} );

	for ( const [ first, ...switches ] of TOURS ) {
		test( `refreshes once after ${ [ first, ...switches ].join( ' → ' ) }`, async ( { page } ) => {
			await openMember( page, first );
			for ( const slug of switches ) {
				await switchTo( page, slug );
			}
			const refreshes = await routeStaleNonce( page );

			const outcome = await page.evaluate(
				( { probe } ) =>
					Promise.race( [
						( window as unknown as ApiFetchWindow ).wp
							.apiFetch( { path: `/wp/v2/users/me?${ probe }=1` } )
							.then(
								() => 'ok',
								( error: { code?: string } ) => `error: ${ error.code }`
							),
						// Long enough for a looping page to refresh many times.
						new Promise( resolve => setTimeout( () => resolve( 'timed out' ), 10000 ) ),
					] ),
				{ probe: PROBE }
			);
			await page.unrouteAll( { behavior: 'ignoreErrors' } );

			expect( outcome, 'the retry succeeds' ).toBe( 'ok' );
			expect( refreshes(), 'nonce refreshes' ).toBe( 1 );
		} );
	}
} );
