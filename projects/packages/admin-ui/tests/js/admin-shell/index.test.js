const mockInits = { a: jest.fn(), b: jest.fn() };
// One mock for every copy of the shell: each test loads it again, and earlier copies still hear clicks.
const mockShowHeader = jest.fn( () => () => {} );
const mockCapturedSlug = {};
const mockFeature = { on: true, card: '' };

jest.mock( '../../../src/admin-shell/adapter', () => ( {
	bootFor: jest.fn( () => Promise.resolve( { initSinglePage: jest.fn() } ) ),
	isolateRouters: jest.fn( ( getVisible, onWrite ) => ( {
		listen: jest.fn(),
		isMounting: () => false,
		mount: jest.fn(),
		mounted: jest.fn(),
		pushUrl: jest.fn( url => {
			globalThis.history.pushState( null, '', url );
			onWrite();
		} ),
		replaceUrl: jest.fn( url => {
			globalThis.history.replaceState( null, '', url );
			onWrite();
		} ),
	} ) ),
	notifyRouters: jest.fn(),
	prefetchBoot: jest.fn( () => Promise.resolve() ),
	trackViewTransitions: jest.fn(),
	transitionSettled: jest.fn( () => Promise.resolve() ),
} ) );
jest.mock( '../../../src/admin-shell/app', () => ( {
	createApp: jest.fn( ( ...args ) =>
		jest.requireActual( '../../../src/admin-shell/app' ).createApp( ...args )
	),
	whenRendered: jest.fn( () => Promise.resolve() ),
} ) );
jest.mock( '../../../src/admin-shell/guest-assets', () => ( {
	applyGuestAssets: jest.fn( () => Promise.resolve( {} ) ),
} ) );
jest.mock( '../../../src/admin-shell/header', () => ( {
	configureHeaders: jest.fn(),
	rememberHeader: jest.fn(),
	removeHeader: jest.fn(),
	showHeader: mockShowHeader,
} ) );
jest.mock( '../../../src/admin-shell/overlays', () => ( {
	closeDialogsOf: jest.fn( () => Promise.resolve() ),
	closeOverlayAround: jest.fn( () => Promise.resolve( false ) ),
	showOverlaysOf: jest.fn(),
	trackOverlays: jest.fn(),
} ) );
jest.mock( 'test-guest-a/init', () => ( { init: () => mockInits.a() } ), { virtual: true } );
jest.mock( 'test-guest-b/init', () => ( { init: () => mockInits.b() } ), { virtual: true } );
// A route module captures the Jetpack config when it is evaluated, as @automattic/jetpack-config does.
jest.mock(
	'test-guest-a/route',
	() => {
		mockCapturedSlug.a = globalThis.jetpackConfig?.consumer_slug;
		return {};
	},
	{ virtual: true }
);
jest.mock(
	'test-guest-b/route',
	() => {
		mockCapturedSlug.b = globalThis.jetpackConfig?.consumer_slug;
		return {};
	},
	{ virtual: true }
);

const member = ( slug, guest, routes = guest ) => ( {
	mountId: `${ slug }-app`,
	initModules: guest ? [ `test-guest-${ guest }/init` ] : [],
	routes: routes ? [ { route_module: `test-guest-${ routes }/route` } ] : [],
} );

const settle = async () => {
	for ( let i = 0; i < 20; i++ ) {
		await new Promise( resolve => setTimeout( resolve, 0 ) );
	}
};

const open = slug => document.querySelector( `#adminmenu a[href$="page=${ slug }"]` ).click();

const hover = slug =>
	document
		.querySelector( `#adminmenu a[href$="page=${ slug }"]` )
		.dispatchEvent( new Event( 'pointerover', { bubbles: true } ) );

beforeEach( () => {
	mockShowHeader.mockClear();
	mockInits.a.mockReset();
	mockInits.b.mockReset();
	delete mockCapturedSlug.a;
	delete mockCapturedSlug.b;
	delete globalThis.jetpackConfig;
	window.history.replaceState( null, '', '/wp-admin/admin.php?page=host' );
	const config = {
		host: 'host',
		members: {
			host: member( 'host' ),
			'guest-a': { ...member( 'guest-a', 'a' ), header: { title: 'Guest A', subtitle: 'Sub' } },
			'guest-b': member( 'guest-b', 'b' ),
			// Another page built from guest A's package: same init module.
			'guest-a2': member( 'guest-a2', 'a', null ),
		},
		guestAssetsUrl: '/wp-admin/admin-ajax.php',
		headerStorageKey: 'test',
		featureUrl: '/wp-admin/admin-ajax.php?action=feature',
		featureOff: {
			heading: '%s is turned off',
			text: 'Turn it back on.',
			button: 'Turn on',
			busy: 'Turning on…',
			failed: 'Failed.',
		},
	};
	config.members[ 'guest-b' ].gate = { module: 'b-module' };
	config.members[ 'guest-b' ].gateNonce = 'b-nonce';
	mockFeature.on = true;
	mockFeature.card = '';
	jest.spyOn( window, 'scrollTo' ).mockImplementation();
	// eslint-disable-next-line jest/prefer-spy-on -- jsdom has no fetch to spy on.
	global.fetch = jest.fn( async ( url, options ) => ( {
		json: async () =>
			options?.method === 'POST'
				? { success: false, data: { message: 'Not allowed.' } }
				: { success: true, data: { on: mockFeature.on, card: mockFeature.card } },
	} ) );
	document.body.innerHTML = `
		<ul id="adminmenu">
			<li><a href="/wp-admin/admin.php?page=host">Host</a></li>
			<li><a href="/wp-admin/admin.php?page=guest-a">A</a></li>
			<li><a href="/wp-admin/admin.php?page=guest-b">B</a></li>
			<li><a href="/wp-admin/admin.php?page=guest-a2">A2</a></li>
		</ul>
		<div id="host-app"></div>
		<script type="application/json" id="wp-script-module-data-@automattic/jetpack-admin-shell">${ JSON.stringify(
			config
		) }</script>`;
	// The shell imports guest modules into the shared registry; reset it so each test evaluates them anew.
	jest.resetModules();
	jest.spyOn( document, 'addEventListener' );
	jest.spyOn( window, 'scrollTo' ).mockImplementation( () => {} );
	require( '../../../src/admin-shell/index' );
} );

afterEach( () => {
	jest.useRealTimers();
	window.removeEventListener( 'jetpack-admin-shell:before-leave', mockStay );
	// The document outlives each test: drop the previous shell's click handler.
	for ( const args of document.addEventListener.mock.calls ) {
		document.removeEventListener( ...args );
	}
	jest.restoreAllMocks();
} );

// A member with unsaved changes whose user chooses to stay.
const mockStay = jest.fn( event => event.detail.page === 'guest-a' && event.preventDefault() );

const click = href => {
	const a = document.createElement( 'a' );
	a.href = href;
	( href.endsWith( 'page=guest-a' ) || href.endsWith( 'page=guest-b' )
		? document.querySelector( `#adminmenu a[href="${ href }"]` )
		: document.body.appendChild( a )
	).click();
};

const where = () => location.search;
const stateOf = slug =>
	document.querySelector( `[data-shell-page="${ slug }"]` )?.dataset.shellState;

describe( 'admin shell leave guard', () => {
	const A = '/wp-admin/admin.php?page=guest-a';
	const B = '/wp-admin/admin.php?page=guest-b';

	// Back/Forward to `url`, as the browser reports it to the shell.
	const popTo = url => {
		const { isolateRouters } = require( '../../../src/admin-shell/adapter' );
		const onPopState = isolateRouters.mock.results[ 0 ].value.listen.mock.calls.find(
			( [ type ] ) => type === 'popstate'
		)[ 1 ];
		globalThis.history.replaceState( null, '', url );
		onPopState( { isTrusted: true } );
	};

	beforeEach( async () => {
		click( `${ A }&p=%2Fone` );
		await settle();
		mockStay.mockClear();
	} );

	it.each( [
		[ 'stays where it is', true, '?page=guest-b' ],
		[ 'opens the new route', false, '?page=guest-a&p=%2Ftwo' ],
	] )(
		'asks a hidden member with unsaved changes before a link retargets it, and %s',
		async ( _, stay, expected ) => {
			click( B );
			await settle();
			if ( stay ) {
				window.addEventListener( 'jetpack-admin-shell:before-leave', mockStay );
			}
			click( `${ A }&p=%2Ftwo` );
			await settle();

			expect( where() ).toBe( expected );
		}
	);

	it( 'switches away from a member with unsaved changes without asking, and back to the same route', async () => {
		window.addEventListener( 'jetpack-admin-shell:before-leave', mockStay );
		click( B );
		await settle();

		expect( where() ).toBe( '?page=guest-b' );
		expect( stateOf( 'guest-a' ) ).toBe( 'hidden' );

		click( A );
		await settle();

		expect( mockStay ).not.toHaveBeenCalled();
		expect( where() ).toBe( '?page=guest-a&p=%2Fone' );
		expect( stateOf( 'guest-a' ) ).toBe( 'visible' );
	} );

	it( 'asks before the menu link of the page on screen opens it at another route', async () => {
		window.addEventListener( 'jetpack-admin-shell:before-leave', mockStay );
		click( A );
		await settle();

		expect( where() ).toBe( '?page=guest-a&p=%2Fone' );
	} );

	it( 'reopens a member with unsaved changes where it was left when Back would retarget it', async () => {
		click( B );
		await settle();
		window.addEventListener( 'jetpack-admin-shell:before-leave', mockStay );
		popTo( `${ A }&p=%2Fzero` );
		await settle();

		expect( mockStay ).toHaveBeenCalled();
		expect( where() ).toBe( '?page=guest-a&p=%2Fone' );
		expect( stateOf( 'guest-a' ) ).toBe( 'visible' );
	} );

	it.each( [
		[ 'inside the member', async () => popTo( `${ A }&p=%2Fzero` ) ],
		[
			'into it from another member',
			async () => {
				click( B );
				await settle();
				popTo( `${ A }&p=%2Fzero` );
			},
		],
	] )(
		'reopens a member from the menu where Back/Forward %s left it, without asking',
		async ( _, goBack ) => {
			await goBack();
			await settle();
			window.addEventListener( 'jetpack-admin-shell:before-leave', mockStay );
			click( B );
			await settle();
			click( A );
			await settle();

			expect( mockStay ).not.toHaveBeenCalled();
			expect( where() ).toBe( '?page=guest-a&p=%2Fzero' );
		}
	);

	it( 'keeps a declined Back on the route the member shows after an earlier Back into it', async () => {
		click( B );
		await settle();
		popTo( `${ A }&p=%2Fzero` );
		await settle();
		click( B );
		await settle();
		window.addEventListener( 'jetpack-admin-shell:before-leave', mockStay );
		popTo( `${ A }&p=%2Ftwo` );
		await settle();

		expect( mockStay ).toHaveBeenCalled();
		expect( where() ).toBe( '?page=guest-a&p=%2Fzero' );
	} );
} );

describe( 'admin shell prewarm', () => {
	it( "retries a guest's init after it failed, without holding up other guests", async () => {
		mockInits.a.mockRejectedValueOnce( new Error( 'apiFetch failed' ) );

		hover( 'guest-a' );
		await settle();
		hover( 'guest-b' );
		await settle();
		hover( 'guest-a' );
		await settle();

		expect( mockInits.a ).toHaveBeenCalledTimes( 2 );
		expect( mockInits.b ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'gives up on an init that never settles and boots the next guest', async () => {
		jest.useFakeTimers();
		mockInits.a.mockReturnValue( new Promise( () => {} ) );

		hover( 'guest-a' );
		hover( 'guest-b' );
		await jest.advanceTimersByTimeAsync( 15000 );
		hover( 'guest-a' );
		await jest.advanceTimersByTimeAsync( 0 );

		expect( mockInits.b ).toHaveBeenCalledTimes( 1 );
		expect( mockInits.a ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'runs an init module shared by two pages once when both prewarm together', async () => {
		let finishA;
		mockInits.a.mockReturnValue( new Promise( resolve => ( finishA = resolve ) ) );

		hover( 'guest-a' );
		hover( 'guest-a2' );
		await settle();
		finishA();
		await settle();

		expect( mockInits.a ).toHaveBeenCalledTimes( 1 );
	} );

	it( "evaluates each guest's route modules with its own Jetpack config when prewarms overlap", async () => {
		let finishA;
		mockInits.a.mockImplementation( () => {
			globalThis.jetpackConfig = { consumer_slug: 'a' };
			return new Promise( resolve => ( finishA = resolve ) );
		} );
		mockInits.b.mockImplementation( () => {
			globalThis.jetpackConfig = { consumer_slug: 'b' };
		} );

		hover( 'guest-a' );
		await settle();
		hover( 'guest-b' );
		await settle();
		finishA();
		await settle();

		expect( mockCapturedSlug ).toEqual( { a: 'a', b: 'b' } );
	} );
} );

describe( 'admin shell switch', () => {
	const A = '/wp-admin/admin.php?page=guest-a';
	const B = '/wp-admin/admin.php?page=guest-b';

	it( 'shows a page once when a switch back to it overtakes one still waiting on a dialog', async () => {
		click( A );
		await settle();
		click( B );
		await settle();
		const { createApp } = require( '../../../src/admin-shell/app' );
		const { closeDialogsOf } = require( '../../../src/admin-shell/overlays' );
		const appA = createApp.mock.results.find( ( { value } ) => value.slug === 'guest-a' ).value;
		const focusHeading = jest.spyOn( appA, 'focusHeading' );
		const closeDialogs = [];
		closeDialogsOf.mockImplementation(
			() => new Promise( resolve => closeDialogs.push( resolve ) )
		);

		click( A );
		await settle();
		click( B );
		await settle();
		click( A );
		await settle();
		closeDialogs.forEach( resolve => resolve() );
		await settle();

		expect( focusHeading ).toHaveBeenCalledTimes( 1 );
	} );
} );

describe( 'admin shell stand-in header', () => {
	it.each( [
		[
			'its declared header on the view a bare link opens',
			'',
			{ title: 'Guest A', subtitle: 'Sub' },
		],
		[ 'only its menu label on any other view', '&p=%2Fdeep', null ],
	] )( 'gives a page %s', async ( _, query, header ) => {
		jest.spyOn( window, 'scrollTo' ).mockImplementation( () => {} );
		const link = document.createElement( 'a' );
		link.href = `/wp-admin/admin.php?page=guest-a${ query }`;
		document.body.append( link );

		link.click();
		await settle();

		expect( mockShowHeader ).toHaveBeenCalledWith( 'guest-a', expect.anything(), 'A', header );
	} );
} );

describe( 'admin shell turned-off features', () => {
	const panel = () => document.querySelector( '.jetpack-admin-shell-feature-off' );

	const shownEvents = [];
	const recordShown = event => shownEvents.push( event.detail.page );
	beforeEach( () => {
		shownEvents.length = 0;
		window.addEventListener( 'jetpack-admin-shell:page-shown', recordShown );
	} );
	afterEach( () => window.removeEventListener( 'jetpack-admin-shell:page-shown', recordShown ) );

	// Holds the next feature checks for guest B until released.
	const holdChecks = () => {
		const answer = global.fetch.getMockImplementation();
		const held = [];
		global.fetch.mockImplementation( ( url, options ) =>
			String( url ).includes( 'member=guest-b' ) && ! options?.method
				? new Promise( resolve => held.push( () => resolve( answer( url, options ) ) ) )
				: answer( url, options )
		);
		return () => held.splice( 0 ).forEach( release => release() );
	};

	it( 'shows the turn-on panel instead of a page whose feature is off, without downloading the page', async () => {
		mockFeature.on = false;

		open( 'guest-b' );
		await settle();

		expect( panel()?.querySelector( 'h1' ).textContent ).toBe( 'B is turned off' );
		expect( panel().querySelector( 'h1' ) ).toHaveFocus();
		const { applyGuestAssets } = require( '../../../src/admin-shell/guest-assets' );
		expect( applyGuestAssets ).not.toHaveBeenCalledWith( expect.anything(), 'guest-b' );
	} );

	it( 'boots a page once when it is opened again before its first check came back', async () => {
		const release = holdChecks();

		open( 'guest-b' );
		await settle();
		open( 'host' );
		await settle();
		open( 'guest-b' );
		await settle();
		release();
		await settle();

		const { createApp } = require( '../../../src/admin-shell/app' );
		expect( createApp.mock.calls.filter( ( [ page ] ) => page === 'guest-b' ) ).toHaveLength( 1 );
		expect( stateOf( 'guest-b' ) ).toBe( 'visible' );
	} );

	it( 'shows the stand-in header while the check is out, and boots the page when the check stalls', async () => {
		const stall = new AbortController();
		const timeout = AbortSignal.timeout;
		AbortSignal.timeout = () => stall.signal;
		const answer = global.fetch.getMockImplementation();
		// The check never answers; only its timeout ends it.
		global.fetch.mockImplementation( ( url, options ) =>
			String( url ).includes( 'member=guest-b' )
				? new Promise( ( resolve, reject ) =>
						options?.signal?.addEventListener( 'abort', () => reject( options.signal.reason ) )
					)
				: answer( url, options )
		);

		open( 'guest-b' );
		await settle();
		expect( mockShowHeader ).toHaveBeenCalledWith( 'guest-b', expect.anything(), 'B', undefined );
		stall.abort();
		await settle();
		AbortSignal.timeout = timeout;

		expect( stateOf( 'guest-b' ) ).toBe( 'visible' );
		expect( panel() ).toBeNull();
	} );

	it( 'checks again on every visit and swaps a booted page for the panel once it is off', async () => {
		open( 'guest-b' );
		await settle();
		expect( panel() ).toBeNull();
		open( 'host' );
		await settle();

		mockFeature.on = false;
		open( 'guest-b' );
		await settle();

		expect( panel() ).not.toBeNull();
		open( 'host' );
		await settle();
		expect( panel() ).toBeNull();
	} );

	it( 'says a booted page was shown only once its check says it is still on', async () => {
		open( 'guest-b' );
		await settle();
		open( 'host' );
		await settle();
		const release = holdChecks();
		mockFeature.on = false;

		open( 'guest-b' );
		await settle();
		release();
		await settle();

		expect( shownEvents.filter( page => page === 'guest-b' ) ).toHaveLength( 1 );
		expect( panel().querySelector( 'h1' ) ).toHaveFocus();
	} );

	it( 'moves focus to the panel only once a closing dialog is gone', async () => {
		const { closeDialogsOf } = require( '../../../src/admin-shell/overlays' );
		let closeDialog;
		closeDialogsOf.mockImplementation( () => new Promise( resolve => ( closeDialog = resolve ) ) );
		mockFeature.on = false;

		open( 'guest-b' );
		await settle();
		expect( panel().querySelector( 'h1' ) ).not.toHaveFocus();
		closeDialog();
		await settle();

		expect( panel().querySelector( 'h1' ) ).toHaveFocus();
	} );

	it( 'shows the panel over the host page when it loads with its feature off', async () => {
		const data = document.getElementById( 'wp-script-module-data-@automattic/jetpack-admin-shell' );
		const config = JSON.parse( data.textContent );
		config.members.host = {
			...config.members.host,
			gate: { module: 'h' },
			featureOn: false,
			featureCard: '<div class="site-card"><h1>Host card</h1></div>',
		};
		data.textContent = JSON.stringify( config );

		jest.resetModules();
		require( '../../../src/admin-shell/index' );
		await settle();

		expect( panel()?.dataset.shellPage ).toBe( 'host' );
		expect( panel().querySelector( '.site-card h1' ) ).toHaveTextContent( 'Host card' );
		expect( global.fetch.mock.calls.map( ( [ url ] ) => String( url ) ).join() ).not.toContain(
			'member=host'
		);
		expect( shownEvents ).not.toContain( 'host' );
	} );

	it( 'shows no panel for a page the user left before its check came back', async () => {
		const answer = global.fetch.getMockImplementation();
		let release;
		global.fetch.mockImplementation( ( url, options ) =>
			String( url ).includes( 'action=feature' ) && String( url ).includes( 'member=guest-b' )
				? new Promise( resolve => ( release = () => resolve( answer( url, options ) ) ) )
				: answer( url, options )
		);
		mockFeature.on = false;

		open( 'guest-b' );
		await settle();
		open( 'guest-a' );
		await settle();
		release();
		await settle();

		expect( panel() ).toBeNull();
	} );

	it( "shows the site's card for the feature when it sends one, and runs its script", async () => {
		mockFeature.on = false;
		mockFeature.card =
			'<div class="site-card"><h1>B card</h1></div><script>document.querySelector( ".site-card" ).dataset.ran = "yes";</script>';

		open( 'guest-b' );
		await settle();

		expect( panel().querySelector( '.site-card h1' ) ).toHaveTextContent( 'B card' );
		expect( panel().querySelector( '.site-card' ) ).toHaveAttribute( 'data-ran', 'yes' );
	} );

	it( "sends the page's gate to turn it on, and shows why when that fails", async () => {
		mockFeature.on = false;
		open( 'guest-b' );
		await settle();

		panel().querySelector( 'button' ).click();
		await settle();

		const [ , options ] = global.fetch.mock.calls.at( -1 );
		expect( Object.fromEntries( options.body ) ).toEqual( {
			member: 'guest-b',
			module: 'b-module',
			gate_nonce: 'b-nonce',
			activate: '1',
		} );
		expect( panel().querySelector( '[role="alert"]' ) ).toHaveTextContent( 'Not allowed.' );
	} );
} );
