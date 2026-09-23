import { fetchAdminMenu, linksTo, syncAdminMenu } from '../admin-menu-sync';

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

	it( 'gives a top-level item its first submenu, and takes its last away', () => {
		const crm = ( pages: string ) =>
			`<li id="toplevel_page_crm"><a href="admin.php?page=crm">CRM</a>${ pages }</li>`;

		syncAdminMenu( live, freshMenu( [ 'my-jetpack', 'jetpack' ], crm( '' ) ) );

		const added = syncAdminMenu(
			live,
			freshMenu( [ 'my-jetpack', 'jetpack' ], crm( submenu( 'crm', 'crm-contacts' ) ) )
		);
		const item = live.querySelector( '#toplevel_page_crm' );

		expect( added.map( entry => entry.textContent ) ).toEqual( [ 'crm', 'crm-contacts' ] );
		expect( item ).toHaveClass( 'wp-has-submenu' );

		syncAdminMenu( live, freshMenu( [ 'my-jetpack', 'jetpack' ], crm( '' ) ) );

		expect( item.querySelector( '.wp-submenu' ) ).toBeNull();
		expect( item ).not.toHaveClass( 'wp-has-submenu' );
	} );
} );

describe( 'syncAdminMenu keys', () => {
	const withCustomize = ( ret: string ) =>
		new DOMParser()
			.parseFromString(
				`<ul id="adminmenu"><li id="menu-appearance"><a href="themes.php">Appearance</a><ul class="wp-submenu"><li><a href="customize.php?return=${ ret }">Customize</a></li></ul></li></ul>`,
				'text/html'
			)
			.getElementById( 'adminmenu' ) as HTMLUListElement;

	it( 'keeps an item whose link only differs by the page it was rendered on', () => {
		document.body.innerHTML = withCustomize(
			'%2Fwp-admin%2Fadmin.php%3Fpage%3Dmy-jetpack'
		).outerHTML;
		const live = document.getElementById( 'adminmenu' ) as HTMLUListElement;
		const customize = live.querySelector( '.wp-submenu li' );

		const added = syncAdminMenu( live, withCustomize( '%2Fwp-admin%2Ftools.php' ) );

		expect( added ).toEqual( [] );
		expect( live.querySelector( '.wp-submenu li' ) ).toBe( customize );
	} );

	it( 'inserts a new item before the first one both menus share', () => {
		document.body.innerHTML = `<ul id="adminmenu"><li id="toplevel_page_jetpack"><a href="admin.php?page=my-jetpack">Jetpack</a></li></ul>`;
		const live = document.getElementById( 'adminmenu' ) as HTMLUListElement;

		const added = syncAdminMenu(
			live,
			freshMenu( [ 'my-jetpack' ] ) // starts with menu-dashboard, which live lacks
		);

		expect( added[ 0 ].id ).toBe( 'menu-dashboard' );
		expect( labels( live )[ 0 ] ).toBe( 'menu-dashboard' );
	} );

	it( 'appends when the fresh menu shares nothing with the live one', () => {
		document.body.innerHTML = `<ul id="adminmenu"><li id="menu-gone"><a href="gone.php">Gone</a></li></ul>`;
		const live = document.getElementById( 'adminmenu' ) as HTMLUListElement;

		const added = syncAdminMenu(
			live,
			new DOMParser()
				.parseFromString(
					`<ul id="adminmenu"><li id="menu-new"><a href="new.php">New</a></li></ul>`,
					'text/html'
				)
				.getElementById( 'adminmenu' ) as HTMLUListElement
		);

		expect( added.map( item => item.id ) ).toEqual( [ 'menu-new' ] );
		expect( labels( live ) ).toEqual( [ 'menu-new' ] );
	} );
} );

describe( 'fetchAdminMenu', () => {
	let fetchMock: jest.Mock;

	beforeEach( () => {
		fetchMock = jest.fn();
		global.fetch = fetchMock;
	} );

	it( 'returns null when the page does not come back', async () => {
		fetchMock.mockResolvedValue( { ok: false, text: async () => '' } );

		await expect( fetchAdminMenu( 'https://example.com/wp-admin/tools.php' ) ).resolves.toBeNull();
	} );

	it( 'returns null when the page carries no menu', async () => {
		fetchMock.mockResolvedValue( { ok: true, text: async () => '<html></html>' } );

		await expect( fetchAdminMenu( 'https://example.com/wp-admin/tools.php' ) ).resolves.toBeNull();
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

	it( 'falls back to the path when the URL has no page argument', () => {
		const [ tools ] = Array.from(
			freshMenu( [] ).querySelectorAll< HTMLElement >( '#menu-tools' )
		);

		expect( linksTo( tools, 'https://example.com/wp-admin/tools.php' ) ).toBe( true );
		expect( linksTo( tools, 'https://example.com/wp-admin/upload.php' ) ).toBe( false );
	} );
} );
