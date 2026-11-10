import { test, expect, type Page } from '@playwright/test';
import { installShellProbe, switchTo, waitForShown } from '../../helpers/admin-shell-helper';

/* JETPACK-3419: a site running only standalone plugins (Backup, Social, VideoPress…), shell flag on. */

/**
 * Admin page slugs of the Jetpack sidebar items that open a wp-admin page.
 *
 * @param page - Page under test, on a wp-admin screen with the sidebar.
 * @return Slugs in sidebar order.
 */
async function jetpackPages( page: Page ): Promise< string[] > {
	const hrefs = await page
		.locator( '#toplevel_page_jetpack .wp-submenu a[href]' )
		.evaluateAll( links => links.map( a => ( a as HTMLAnchorElement ).href ) );
	const slugs = hrefs
		.map( href => new URL( href ) )
		.filter( url => url.pathname.endsWith( '/wp-admin/admin.php' ) )
		.map( url => url.searchParams.get( 'page' ) )
		.filter( ( slug ): slug is string => !! slug );
	return [ ...new Set( slugs ) ];
}

/**
 * Members the shell client was handed on this document, or none when it isn't running.
 * Reads the client's script module data, so it sees members that haven't booted yet.
 *
 * @param page - Page under test.
 * @return Member slugs.
 */
async function shellMembers( page: Page ): Promise< string[] > {
	return page.evaluate( () => {
		const data = document.getElementById(
			'wp-script-module-data-@automattic/jetpack-admin-shell'
		)?.textContent;
		return data ? Object.keys( JSON.parse( data ).members ?? {} ) : [];
	} );
}

test.describe( 'Admin shell: standalone plugins only', () => {
	test( 'the Jetpack plugin is not active', async ( { page } ) => {
		await page.goto( '/wp-admin/plugins.php' );
		await expect( page.locator( '#the-list' ) ).toBeVisible();
		await expect( page.locator( '#the-list tr.active[data-slug="jetpack"]' ) ).toHaveCount( 0 );
	} );

	test( 'every Jetpack page loads, and its sidebar link leads to it', async ( { page } ) => {
		const errors: string[] = [];
		page.on( 'pageerror', error => errors.push( error.message ) );

		await page.goto( '/wp-admin/' );
		const slugs = await jetpackPages( page );
		expect( slugs, 'standalone plugins add Jetpack sidebar items' ).toContain( 'my-jetpack' );

		for ( const slug of slugs ) {
			// From the Dashboard, the Jetpack submenu is a flyout that opens on hover.
			await page.goto( '/wp-admin/' );
			// Leaving a page can abort its view transition; only errors from the page under test count.
			errors.length = 0;
			await page.locator( '#toplevel_page_jetpack' ).hover();
			await page
				.locator( `#toplevel_page_jetpack .wp-submenu a[href$="page=${ slug }"]` )
				.first()
				.click();
			await expect
				.poll( () => new URL( page.url() ).searchParams.get( 'page' ), `${ slug } opens` )
				.toBe( slug );
			await expect( page.locator( 'body' ) ).toHaveClass( new RegExp( `jetpack_page_${ slug }` ) );
			await expect( page.locator( '#wpbody-content' ) ).not.toContainText(
				'Sorry, you are not allowed to access this page.'
			);
			await expect(
				page
					.locator( '#wpbody-content h1, #wpbody-content h2' )
					.filter( { visible: true } )
					.first(),
				`${ slug } renders`
			).toBeVisible();
			expect( errors, `no uncaught page errors on ${ slug }` ).toEqual( [] );
		}
	} );

	test( 'dashboards that joined the shell switch without a page load', async ( { page } ) => {
		await installShellProbe( page );
		await page.goto( '/wp-admin/admin.php?page=my-jetpack' );
		await expect( page.locator( '#wpbody-content' ) ).toBeVisible();
		const members = await shellMembers( page );
		test.skip(
			members.length < 2,
			'The shell is not running on My Jetpack: it needs two member dashboards, and Forms ships only with the Jetpack plugin.'
		);

		await waitForShown( page, 'my-jetpack' );
		for ( const slug of members.filter( s => s !== 'my-jetpack' ) ) {
			await switchTo( page, slug );
			await switchTo( page, 'my-jetpack' );
		}
	} );
} );
