import { linksTo, syncAdminMenu } from '../admin-menu-sync';

const submenu = ( ...pages: string[] ) =>
	`<ul class="wp-submenu"><li class="wp-submenu-head">Jetpack</li>${ pages
		.map( page => `<li><a href="admin.php?page=${ page }">${ page }</a></li>` )
		.join( '' ) }</ul>`;

const menuHtml = ( pages: string[], afterJetpack = '' ) =>
	`<li id="menu-dashboard"><a href="index.php">Dashboard</a></li>
	<li id="toplevel_page_jetpack" class="wp-has-current-submenu">
		<a href="admin.php?page=my-jetpack">Jetpack</a>${ submenu( ...pages ) }
	</li>${ afterJetpack }
	<li class="wp-menu-separator"></li>
	<li id="menu-tools"><a href="tools.php">Tools</a></li>`;

const freshMenu = ( pages: string[], afterJetpack = '' ) =>
	new DOMParser()
		.parseFromString( `<ul id="adminmenu">${ menuHtml( pages, afterJetpack ) }</ul>`, 'text/html' )
		.getElementById( 'adminmenu' ) as HTMLUListElement;

const labels = ( list: Element ) =>
	Array.from( list.querySelectorAll( 'li' ) ).map( item => item.id || item.textContent );

describe( 'syncAdminMenu', () => {
	let live: HTMLUListElement;

	beforeEach( () => {
		document.body.innerHTML = `<ul id="adminmenu">${ menuHtml( [ 'my-jetpack', 'jetpack' ] ) }</ul>`;
		live = document.getElementById( 'adminmenu' ) as HTMLUListElement;
	} );

	it( 'inserts a new submenu item in order and returns it', () => {
		const jetpack = live.querySelector( '#toplevel_page_jetpack' );
		const added = syncAdminMenu( live, freshMenu( [ 'my-jetpack', 'stats', 'jetpack' ] ) );

		expect( added.map( item => item.textContent ) ).toEqual( [ 'stats' ] );
		expect( labels( live ) ).toEqual( [
			'menu-dashboard',
			'toplevel_page_jetpack',
			'Jetpack',
			'my-jetpack',
			'stats',
			'jetpack',
			'',
			'menu-tools',
		] );
		// The item on screen is kept, with this page's classes, not swapped for the fetched one.
		expect( live.querySelector( '#toplevel_page_jetpack' ) ).toBe( jetpack );
		expect( jetpack.className ).toBe( 'wp-has-current-submenu' );
	} );

	it( 'removes items the fresh menu no longer has', () => {
		const added = syncAdminMenu( live, freshMenu( [ 'my-jetpack' ] ) );

		expect( added ).toEqual( [] );
		expect( labels( live ) ).toEqual( [
			'menu-dashboard',
			'toplevel_page_jetpack',
			'Jetpack',
			'my-jetpack',
			'',
			'menu-tools',
		] );
	} );

	it( 'adds a new top-level item after the one before it', () => {
		const added = syncAdminMenu(
			live,
			freshMenu(
				[ 'my-jetpack', 'jetpack' ],
				'<li id="toplevel_page_zerobscrm-dash"><a href="admin.php?page=zerobscrm-dash">CRM</a></li>'
			)
		);

		expect( added.map( item => item.id ) ).toEqual( [ 'toplevel_page_zerobscrm-dash' ] );
		expect(
			labels( live ).filter(
				label => label.startsWith( 'menu-' ) || label.startsWith( 'toplevel' )
			)
		).toEqual( [
			'menu-dashboard',
			'toplevel_page_jetpack',
			'toplevel_page_zerobscrm-dash',
			'menu-tools',
		] );
	} );
} );

describe( 'linksTo', () => {
	it( 'matches an absolute URL to a relative menu link by its page', () => {
		const [ , , advertising ] = Array.from(
			freshMenu( [ 'stats', 'advertising' ] ).querySelectorAll( '.wp-submenu li' )
		);

		expect(
			linksTo( advertising, 'https://example.com/wp-admin/admin.php?page=advertising' )
		).toBe( true );
		expect( linksTo( advertising, 'https://example.com/wp-admin/admin.php?page=search' ) ).toBe(
			false
		);
	} );
} );
