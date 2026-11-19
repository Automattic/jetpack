import { test, expect, type Page } from '@playwright/test';
import { installShellProbe, switchTo, waitForShown } from '../../helpers/admin-shell-helper';

/* JETPACK-3419: a site running only standalone plugins (Backup, Social, VideoPress…), shell flag on. */

/**
 * Jetpack sidebar items that open a wp-admin page.
 *
 * @param page - Page under test, on a wp-admin screen with the sidebar.
 * @return Each item's admin page slug and raw `href`, in sidebar order.
 */
async function jetpackPages( page: Page ): Promise< { slug: string; href: string }[] > {
	const links = await page
		.locator( '#toplevel_page_jetpack .wp-submenu a[href]' )
		.evaluateAll( anchors =>
			anchors.map( a => ( {
				raw: a.getAttribute( 'href' ) ?? '',
				url: ( a as HTMLAnchorElement ).href,
			} ) )
		);
	const pages = new Map< string, string >();
	for ( const { raw, url } of links ) {
		const parsed = new URL( url );
		const slug = parsed.searchParams.get( 'page' );
		if ( parsed.pathname.endsWith( '/wp-admin/admin.php' ) && slug && ! pages.has( slug ) ) {
			pages.set( slug, raw );
		}
	}
	return [ ...pages ].map( ( [ slug, href ] ) => ( { slug, href } ) );
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
		if ( ! data ) {
			return [];
		}
		try {
			const config = JSON.parse( data ) as { members?: Record< string, unknown > };
			return Object.keys( config.members ?? {} );
		} catch {
			return [];
		}
	} );
}

test.describe( 'Admin shell: standalone plugins only', () => {
	test( 'the Jetpack plugin is not active', async ( { page } ) => {
		await page.goto( '/wp-admin/plugins.php' );
		await expect( page.locator( '#the-list' ) ).toBeVisible();
		// By plugin file, not slug: a dev or Beta build of Jetpack lives in another directory.
		await expect( page.locator( '#the-list tr.active[data-plugin$="/jetpack.php"]' ) ).toHaveCount(
			0
		);
	} );

	test( 'every Jetpack page loads, and its sidebar link leads to it', async ( { page } ) => {
		const errors: { page: string | null; message: string }[] = [];
		page.on( 'pageerror', error =>
			errors.push( {
				page: new URL( page.url() ).searchParams.get( 'page' ),
				message: error.message,
			} )
		);

		await page.goto( '/wp-admin/' );
		const pages = await jetpackPages( page );
		expect(
			pages.map( p => p.slug ),
			'standalone plugins add Jetpack sidebar items'
		).toContain( 'my-jetpack' );

		for ( const { slug, href } of pages ) {
			// From the Dashboard, the Jetpack submenu is a flyout that opens on hover.
			await page.goto( '/wp-admin/' );
			errors.length = 0;
			await page.locator( '#toplevel_page_jetpack' ).hover();
			await page
				.locator( `#toplevel_page_jetpack .wp-submenu a[href="${ href }"]` )
				.first()
				.click();
			await expect
				.poll( () => new URL( page.url() ).searchParams.get( 'page' ), `${ slug } opens` )
				.toBe( slug );
			await expect( page.locator( 'body' ) ).toHaveClass( new RegExp( `jetpack_page_${ slug }` ) );
			await expect( page.locator( '#wpbody-content' ) ).not.toContainText(
				'Sorry, you are not allowed to access this page.'
			);
			// The heading check below would also accept an error screen's heading.
			await expect( page.locator( '#wpbody-content' ) ).not.toContainText(
				/no route found|route not found|there has been a critical error/i
			);
			await expect(
				page
					.locator( '#wpbody-content h1, #wpbody-content h2' )
					.filter( { visible: true } )
					.first(),
				`${ slug } renders`
			).toBeVisible();
			// The Dashboard's aborted requests reject as it unloads (Firefox, WebKit); only the page under test counts.
			expect(
				errors.filter( e => e.page === slug ).map( e => e.message ),
				`no uncaught page errors on ${ slug }`
			).toEqual( [] );
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
