let mockMounting = false;
const mockInits = { a: jest.fn(), b: jest.fn() };
// One mock for every copy of the shell: each test loads it again, and earlier copies still hear clicks.
const mockShowHeader = jest.fn( () => () => {} );
const mockCapturedSlug = {};
const mockFeature = { on: true, card: '' };

jest.mock( '../../../src/admin-shell/adapter', () => ( {
	bootFor: jest.fn( () => Promise.resolve( { initSinglePage: jest.fn() } ) ),
	isolateRouters: jest.fn( ( getVisible, onWrite ) => ( {
		listen: jest.fn(),
		isMounting: () => mockMounting,
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
	loadPage: jest.fn(),
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

jest.mock(
	'test-guest-a2/route',
	() => {
		mockCapturedSlug.a2 = globalThis.jetpackConfig?.consumer_slug;
		return {};
	},
	{ virtual: true }
);
jest.mock(
	'test-guest-h2/route',
	() => {
		mockCapturedSlug.h2 = globalThis.jetpackConfig?.consumer_slug;
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

let mockConfigExtra = {};

const menuLink = slug => document.querySelector( `#adminmenu a[href$="page=${ slug }"]` );
const open = slug => menuLink( slug ).click();
const pointer = ( slug, type ) =>
	menuLink( slug ).dispatchEvent( new Event( type, { bubbles: true } ) );

// Rest the pointer on a menu link long enough for its dashboard to prewarm.
const hover = slug => {
	pointer( slug, 'pointerout' );
	const faked = !! setTimeout.clock;
	if ( ! faked ) {
		jest.useFakeTimers();
	}
	pointer( slug, 'pointerover' );
	jest.advanceTimersByTime( 100 );
	if ( ! faked ) {
		jest.useRealTimers();
	}
};

beforeEach( () => {
	mockShowHeader.mockClear();
	mockInits.a.mockReset();
	mockInits.b.mockReset();
	delete mockCapturedSlug.a;
	delete mockCapturedSlug.b;
	delete mockCapturedSlug.a2;
	delete mockCapturedSlug.h2;
	delete globalThis.jetpackConfig;
	window.history.replaceState( null, '', '/wp-admin/admin.php?page=host' );
	const config = {
		host: 'host',
		members: {
			host: { ...member( 'host' ), initModules: [ 'test-guest-h/init' ] },
			'guest-a': { ...member( 'guest-a', 'a' ), header: { title: 'Guest A', subtitle: 'Sub' } },
			'guest-b': member( 'guest-b', 'b' ),
			// Another page built from guest A's package: same init module.
			'guest-a2': { ...member( 'guest-a2', 'a', 'a2' ), header: false },
			// Built from the host's package: the host page already ran its init.
			'guest-h2': member( 'guest-h2', 'h', 'h2' ),
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
		...mockConfigExtra,
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
			<li><a href="/wp-admin/admin.php?page=guest-h2">H2</a></li>
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

// Back/Forward to `url`, as the browser reports it to the shell.
const popTo = url => {
	const { isolateRouters } = require( '../../../src/admin-shell/adapter' );
	const onPopState = isolateRouters.mock.results[ 0 ].value.listen.mock.calls.find(
		( [ type ] ) => type === 'popstate'
	)[ 1 ];
	globalThis.history.replaceState( null, '', url );
	const event = { isTrusted: true, stopImmediatePropagation: jest.fn() };
	onPopState( event );
	return event;
};

const where = () => location.search;
const stateOf = slug =>
	document.querySelector( `[data-shell-page="${ slug }"]` )?.dataset.shellState;

describe( 'admin shell leave guard', () => {
	const A = '/wp-admin/admin.php?page=guest-a';
	const B = '/wp-admin/admin.php?page=guest-b';

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
	it( 'prewarms only the link the pointer rests on, not those it sweeps past', async () => {
		jest.useFakeTimers();
		pointer( 'guest-a', 'pointerover' );
		jest.advanceTimersByTime( 60 );
		pointer( 'guest-b', 'pointerover' );
		jest.advanceTimersByTime( 60 );
		pointer( 'guest-b', 'pointerout' );
		jest.advanceTimersByTime( 200 );
		pointer( 'guest-a2', 'pointerover' );
		jest.advanceTimersByTime( 100 );
		await jest.advanceTimersByTimeAsync( 0 );

		expect(
			require( '../../../src/admin-shell/guest-assets' ).applyGuestAssets.mock.calls.map(
				( [ , slug ] ) => slug
			)
		).toEqual( [ 'guest-a2' ] );
	} );

	it( 'waits for the click while the user saves data', async () => {
		Object.defineProperty( navigator, 'connection', {
			value: { saveData: true },
			configurable: true,
		} );
		try {
			hover( 'guest-a' );
			await settle();
		} finally {
			delete navigator.connection;
		}

		expect( mockInits.a ).not.toHaveBeenCalled();
	} );

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

	it( "keeps the page's Jetpack config, and gives a page sharing an init module that init's config", async () => {
		// Set after the shell starts, as the host's own init does on DOMContentLoaded.
		const pageConfig = { consumer_slug: 'host' };
		globalThis.jetpackConfig = pageConfig;
		mockInits.a.mockImplementation( () => {
			globalThis.jetpackConfig = { consumer_slug: 'a' };
		} );
		mockInits.b.mockImplementation( () => {
			globalThis.jetpackConfig = { consumer_slug: 'b' };
		} );

		for ( const slug of [ 'guest-a', 'guest-b', 'guest-a2', 'guest-h2' ] ) {
			hover( slug );
			await settle();
		}

		expect( mockCapturedSlug ).toEqual( { a: 'a', b: 'b', a2: 'a', h2: 'host' } );
		expect( globalThis.jetpackConfig ).toBe( pageConfig );
	} );

	it( "keeps a Jetpack config the host's init sets while a guest prewarms", async () => {
		let finishB;
		mockInits.b.mockImplementation( () => {
			globalThis.jetpackConfig = { consumer_slug: 'b' };
			return new Promise( resolve => ( finishB = resolve ) );
		} );

		hover( 'guest-b' );
		await settle();
		const hostConfig = { consumer_slug: 'host' };
		globalThis.jetpackConfig = hostConfig;
		finishB();
		await settle();

		expect( mockCapturedSlug.b ).toBe( 'b' );
		expect( globalThis.jetpackConfig ).toBe( hostConfig );
	} );

	it( "gives a page sharing an init that set no Jetpack config the page's current one", async () => {
		globalThis.jetpackConfig = { consumer_slug: 'old' };
		hover( 'guest-a' );
		await settle();
		globalThis.jetpackConfig = { consumer_slug: 'host' };
		hover( 'guest-a2' );
		await settle();

		expect( mockCapturedSlug ).toEqual( { a: 'old', a2: 'host' } );
	} );

	it.each( [
		[
			'throws',
			() => {
				throw new Error( 'init failed' );
			},
		],
		[ 'rejects', () => Promise.reject( new Error( 'init failed' ) ) ],
	] )(
		"puts the page's Jetpack config back when a guest's init %s after setting its own",
		async ( _, fail ) => {
			const pageConfig = { consumer_slug: 'host' };
			globalThis.jetpackConfig = pageConfig;
			mockInits.a.mockImplementationOnce( () => {
				globalThis.jetpackConfig = { consumer_slug: 'a' };
				return fail();
			} );

			hover( 'guest-a' );
			await settle();

			expect( globalThis.jetpackConfig ).toBe( pageConfig );
		}
	);
} );

describe( 'admin shell switch', () => {
	const A = '/wp-admin/admin.php?page=guest-a';
	const B = '/wp-admin/admin.php?page=guest-b';

	it.each( [
		[ 'fresh', 4, false ],
		[ 'stale', 5, true ],
	] )( 'says a page kept mounted is %s after %i minutes hidden', async ( _, minutes, stale ) => {
		const now = jest.spyOn( Date, 'now' ).mockReturnValue( 0 );
		click( A );
		await settle();
		click( B );
		await settle();
		const shown = [];
		const onShown = event => shown.push( event.detail );
		window.addEventListener( 'jetpack-admin-shell:page-shown', onShown );

		now.mockReturnValue( minutes * 60000 );
		click( A );
		await settle();
		window.removeEventListener( 'jetpack-admin-shell:page-shown', onShown );

		expect( shown ).toEqual( [
			expect.objectContaining( { page: 'guest-a', hiddenFor: minutes * 60000, stale } ),
		] );
	} );

	it( 'keeps a page stale through a show another switch overtook', async () => {
		const now = jest.spyOn( Date, 'now' ).mockReturnValue( 0 );
		click( A );
		await settle();
		click( B );
		await settle();
		const { closeDialogsOf } = require( '../../../src/admin-shell/overlays' );
		closeDialogsOf.mockImplementationOnce( () => new Promise( () => {} ) );
		now.mockReturnValue( 10 * 60000 );
		click( A );
		await settle();
		click( B );
		await settle();
		const shown = [];
		const onShown = event => shown.push( event.detail );
		window.addEventListener( 'jetpack-admin-shell:page-shown', onShown );

		click( A );
		await settle();
		window.removeEventListener( 'jetpack-admin-shell:page-shown', onShown );

		expect( shown ).toEqual( [ expect.objectContaining( { page: 'guest-a', stale: true } ) ] );
	} );

	it( 'names the next page when it hides one, and says whether a shown page is new', async () => {
		const events = [];
		const record = event => events.push( [ event.type.split( ':' )[ 1 ], event.detail ] );
		window.addEventListener( 'jetpack-admin-shell:page-hidden', record );
		window.addEventListener( 'jetpack-admin-shell:page-shown', record );

		try {
			click( A );
			await settle();
			click( B );
			await settle();
			click( A );
			await settle();
		} finally {
			window.removeEventListener( 'jetpack-admin-shell:page-hidden', record );
			window.removeEventListener( 'jetpack-admin-shell:page-shown', record );
		}

		expect(
			events.map( ( [ type, { page, previous, next, firstShow, routeChanged } ] ) =>
				type === 'page-hidden'
					? [ type, page, next ]
					: [ type, page, previous, firstShow, routeChanged ]
			)
		).toEqual( [
			[ 'page-hidden', 'host', 'guest-a' ],
			[ 'page-shown', 'guest-a', 'host', true, false ],
			[ 'page-hidden', 'guest-a', 'guest-b' ],
			[ 'page-shown', 'guest-b', 'guest-a', true, false ],
			[ 'page-hidden', 'guest-b', 'guest-a' ],
			[ 'page-shown', 'guest-a', 'guest-b', false, false ],
		] );
	} );

	it.each( [
		[ 'a link opens it at another route', true, () => click( `${ A }&p=%2Ftwo` ) ],
		[ 'Back opens it at another route', true, () => popTo( `${ A }&p=%2Fzero` ) ],
		[ 'Back returns to the route it was left on', false, () => popTo( `${ A }&p=%2Fone` ) ],
		[
			'its unsaved changes keep it on the route it was left on',
			false,
			() => {
				window.addEventListener( 'jetpack-admin-shell:before-leave', mockStay );
				popTo( `${ A }&p=%2Fzero` );
			},
		],
	] )( 'says whether a kept page changed route when %s', async ( _, expected, reopen ) => {
		click( `${ A }&p=%2Fone` );
		await settle();
		click( B );
		await settle();
		const shown = [];
		const record = event => shown.push( event.detail );
		window.addEventListener( 'jetpack-admin-shell:page-shown', record );

		try {
			reopen();
			await settle();
		} finally {
			window.removeEventListener( 'jetpack-admin-shell:page-shown', record );
		}

		expect( shown ).toEqual( [
			expect.objectContaining( { page: 'guest-a', firstShow: false, routeChanged: expected } ),
		] );
	} );

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
			'guest-a',
			'',
			'Guest A',
			{ title: 'Guest A', subtitle: 'Sub' },
		],
		[ 'only its declared title on any other view', 'guest-a', '&p=%2Fdeep', 'Guest A', null ],
		[ 'its menu label when it declares no header', 'guest-b', '', 'B', undefined ],
	] )( 'gives a page %s', async ( _, slug, query, title, header ) => {
		const link = document.createElement( 'a' );
		link.href = `/wp-admin/admin.php?page=${ slug }${ query }`;
		document.body.append( link );

		link.click();
		await settle();

		expect( mockShowHeader ).toHaveBeenCalledWith( slug, expect.anything(), title, header );
	} );

	it( 'shows none for a page that opts out of it', async () => {
		document.querySelector( '#adminmenu a[href$="page=guest-a2"]' ).click();
		await settle();

		expect( document.getElementById( 'guest-a2-app' ) ).not.toBeNull();
		expect( mockShowHeader.mock.calls.map( ( [ slug ] ) => slug ) ).not.toContain( 'guest-a2' );
	} );
} );

describe( 'admin shell live-app limit', () => {
	const A = '/wp-admin/admin.php?page=guest-a';
	// Whether the shell kept the last click, or left it to load the page.
	let kept;
	const keepClick = event => {
		kept = event.defaultPrevented;
		event.preventDefault();
	};
	const prewarmed = () =>
		require( '../../../src/admin-shell/guest-assets' ).applyGuestAssets.mock.calls.map(
			( [ , slug ] ) => slug
		);

	beforeAll( () => {
		mockConfigExtra = { maxLiveApps: 3 };
	} );
	beforeEach( () => {
		kept = undefined;
		window.addEventListener( 'click', keepClick );
	} );
	afterEach( () => window.removeEventListener( 'click', keepClick ) );
	afterAll( () => {
		mockConfigExtra = {};
	} );

	// Fill the limit: the host, guest A mounted or only prewarmed, and guest B mounted.
	const fill = async prewarmOnly => {
		if ( prewarmOnly ) {
			hover( 'guest-a' );
		} else {
			click( A );
		}
		await settle();
		click( '/wp-admin/admin.php?page=guest-b' );
		await settle();
		kept = undefined;
	};

	it.each( [
		[ 'mounted', false ],
		[ 'only prewarmed', true ],
	] )(
		'loads the page for a new dashboard once the limit is reached with one %s',
		async ( _, prewarmOnly ) => {
			await fill( prewarmOnly );
			click( '/wp-admin/admin.php?page=guest-a2' );
			await settle();

			expect( kept ).toBe( false );
			expect( stateOf( 'guest-a2' ) ).toBeUndefined();
			expect( prewarmed() ).toEqual( [ 'guest-a', 'guest-b' ] );
		}
	);

	const A2 = '/wp-admin/admin.php?page=guest-a2';
	const loaded = () => require( '../../../src/admin-shell/adapter' ).loadPage.mock.calls;

	it( 'loads the page for Back/Forward to a new dashboard once the limit is reached', async () => {
		await fill( false );
		const back = popTo( A2 );
		await settle();

		expect( loaded() ).toEqual( [
			[ expect.stringContaining( 'page=guest-a2' ), { replace: true } ],
		] );
		expect( stateOf( 'guest-a2' ) ).toBeUndefined();
		expect( prewarmed() ).toEqual( [ 'guest-a', 'guest-b' ] );
		// The visible app keeps its own URL, and its routers and guards never hear the popstate.
		expect( where() ).toBe( '?page=guest-b' );
		expect( back.stopImmediatePropagation ).toHaveBeenCalled();
	} );

	it( 'loads the page for Back/Forward while an app mounts, without asking', async () => {
		mockStay.mockClear();
		window.addEventListener( 'jetpack-admin-shell:before-leave', mockStay );
		mockMounting = true;
		try {
			popTo( A2 );
			await settle();
		} finally {
			mockMounting = false;
		}

		expect( loaded() ).toEqual( [
			[ expect.stringContaining( 'page=guest-a2' ), { replace: true } ],
		] );
		expect( mockStay ).not.toHaveBeenCalled();
		expect( where() ).toBe( '?page=host' );
	} );

	it.each( [
		[ 'a click', () => click( A2 ) ],
		[ 'Back/Forward', () => popTo( A2 ) ],
	] )( 'stays past the limit when a hidden dashboard keeps its edits, on %s', async ( _, go ) => {
		await fill( false );
		mockStay.mockClear();
		window.addEventListener( 'jetpack-admin-shell:before-leave', mockStay );
		go();
		await settle();

		expect( mockStay ).toHaveBeenCalledWith(
			expect.objectContaining( {
				detail: { page: 'guest-a', url: expect.stringContaining( 'page=guest-a2' ) },
			} )
		);
		expect( kept ).not.toBe( false );
		expect( loaded() ).toEqual( [] );
		expect( where() ).toBe( '?page=guest-b' );
		expect( stateOf( 'guest-b' ) ).toBe( 'visible' );
	} );

	it.each( [
		[ 'stays when a hidden dashboard keeps its edits', true, [] ],
		[ 'loads the page otherwise', false, [ [ expect.stringContaining( 'page=guest-a2' ) ] ] ],
	] )( '%s, when the last slot went while an overlay closed', async ( _, stays, expected ) => {
		click( A );
		await settle();
		let closeOverlay;
		require( '../../../src/admin-shell/overlays' ).closeOverlayAround.mockImplementationOnce(
			() => new Promise( resolve => ( closeOverlay = resolve ) )
		);
		click( A2 );
		click( '/wp-admin/admin.php?page=guest-b' );
		await settle();
		mockStay.mockClear();
		if ( stays ) {
			window.addEventListener( 'jetpack-admin-shell:before-leave', mockStay );
		}
		closeOverlay( true );
		await settle();

		expect( loaded() ).toEqual( expected );
		expect( mockStay.mock.calls.length > 0 ).toBe( stays );
		expect( stateOf( 'guest-a2' ) ).toBeUndefined();
		expect( where() ).toBe( '?page=guest-b' );
	} );

	it.each( [
		[ 'back to a mounted one', false, '/wp-admin/admin.php?page=host', 'host' ],
		[ 'to one only prewarmed', true, A, 'guest-a' ],
	] )( 'switches in place at the limit %s', async ( _, prewarmOnly, href, shown ) => {
		await fill( prewarmOnly );
		click( href );
		await settle();

		expect( kept ).toBe( true );
		expect( stateOf( shown ) ).toBe( 'visible' );
	} );

	it( 'keeps the last slot for a click rather than a hover', async () => {
		hover( 'guest-a' );
		await settle();
		hover( 'guest-b' );
		await settle();

		expect( prewarmed() ).toEqual( [ 'guest-a' ] );

		click( '/wp-admin/admin.php?page=guest-b' );
		await settle();

		expect( kept ).toBe( true );
		expect( stateOf( 'guest-b' ) ).toBe( 'visible' );
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

	it.each( [
		[ 'booted', true ],
		[ 'still booting', false ],
	] )(
		'lets the newer check win when an older one for a %s page comes back last',
		async ( _, booted ) => {
			if ( booted ) {
				open( 'guest-b' );
				await settle();
				open( 'host' );
				await settle();
			}
			const answers = [];
			const answer = global.fetch.getMockImplementation();
			global.fetch.mockImplementation( ( url, options ) =>
				String( url ).includes( 'member=guest-b' ) && ! options?.method
					? new Promise( resolve => answers.push( resolve ) )
					: answer( url, options )
			);
			const reply = on => ( { json: async () => ( { success: true, data: { on, card: '' } } ) } );

			open( 'guest-b' );
			await settle();
			open( 'host' );
			await settle();
			open( 'guest-b' );
			await settle();
			answers[ 1 ]( reply( true ) );
			await settle();
			answers[ 0 ]( reply( false ) );
			await settle();

			expect( panel() ).toBeNull();
			expect( stateOf( 'guest-b' ) ).toBe( 'visible' );
		}
	);

	it( 'does not prewarm a page on hover once its check said its feature is off', async () => {
		mockFeature.on = false;
		open( 'guest-b' );
		await settle();
		open( 'host' );
		await settle();

		hover( 'guest-b' );
		await settle();

		const { applyGuestAssets } = require( '../../../src/admin-shell/guest-assets' );
		expect( applyGuestAssets ).not.toHaveBeenCalledWith( expect.anything(), 'guest-b' );
	} );

	it( 'counts the panel as neither showing nor hiding the page', async () => {
		open( 'guest-b' );
		await settle();
		open( 'host' );
		await settle();
		const hidden = [];
		const recordHidden = event => hidden.push( event.detail.page );
		window.addEventListener( 'jetpack-admin-shell:page-hidden', recordHidden );
		shownEvents.length = 0;

		mockFeature.on = false;
		open( 'guest-b' );
		await settle();
		open( 'host' );
		await settle();
		window.removeEventListener( 'jetpack-admin-shell:page-hidden', recordHidden );

		expect( hidden ).toEqual( [ 'host' ] );
		expect( shownEvents ).toEqual( [ 'host' ] );
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
