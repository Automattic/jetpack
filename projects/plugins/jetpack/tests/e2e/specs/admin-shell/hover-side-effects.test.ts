import { test, expect, type Page } from '@playwright/test';
import { MEMBERS, installShellProbe, menuLink, openMember } from '../../helpers/admin-shell-helper';

/* Hovering Forms used to save its classic forms state; plugins/e2e-admin-shell.php logs such writes.
 * The optional members aren't on the CI site. */
const GUESTS = MEMBERS.filter( m => m.slug !== 'my-jetpack' && ! m.optional ).map( m => m.slug );
const LOG = '/wp-admin/admin-ajax.php?action=e2e_admin_shell_guest_writes';

type GuestWrites = { member: string; writes: string[] }[];

/**
 * Option and user meta writes the shell's guest requests made, as the e2e plugin logged them.
 *
 * @param page - Page under test, for its session.
 * @return Writes per guest request.
 */
async function guestWrites( page: Page ): Promise< GuestWrites > {
	const response = await page.request.get( LOG );
	expect( response.ok(), 'the e2e plugin answers' ).toBe( true );
	return ( await response.json() ).data;
}

test.describe( 'Admin shell: hover side effects', () => {
	test.beforeEach( async ( { page } ) => {
		// Enough memory that the shell prewarms every member on hover.
		await page.addInitScript( () =>
			Object.defineProperty( Navigator.prototype, 'deviceMemory', { get: () => 8 } )
		);
		await installShellProbe( page );
	} );

	test( 'hovering each dashboard in the menu saves nothing', async ( { page } ) => {
		const reset = await page.request.get( `${ LOG }&reset=1` );
		test.skip( ! reset.ok(), 'Needs the e2e-admin-shell plugin' );
		const fetched = new Set< string >();
		// Finished, not just answered: the plugin logs the writes as the request shuts down.
		page.on( 'requestfinished', request => {
			const url = new URL( request.url() );
			if ( url.searchParams.get( 'action' ) === 'jetpack_admin_shell_guest' ) {
				fetched.add( url.searchParams.get( 'member' ) ?? '' );
			}
		} );
		await openMember( page, 'my-jetpack' );

		for ( const slug of GUESTS ) {
			await menuLink( page, slug ).hover();
			await expect
				.poll( () => fetched.has( slug ), { message: `hovering ${ slug } prewarms it` } )
				.toBe( true );
		}

		expect( await guestWrites( page ) ).toEqual( [] );
	} );
} );
