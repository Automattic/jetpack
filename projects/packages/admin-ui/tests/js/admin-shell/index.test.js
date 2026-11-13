const mockInits = { a: jest.fn(), b: jest.fn() };
const mockCapturedSlug = {};

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
	createApp: jest.requireActual( '../../../src/admin-shell/app' ).createApp,
	whenRendered: jest.fn( () => Promise.resolve() ),
} ) );
jest.mock( '../../../src/admin-shell/guest-assets', () => ( {
	applyGuestAssets: jest.fn( () => Promise.resolve( {} ) ),
} ) );
jest.mock( '../../../src/admin-shell/header', () => ( {
	configureHeaders: jest.fn(),
	rememberHeader: jest.fn(),
	removeHeader: jest.fn(),
	showHeader: jest.fn( () => () => {} ),
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

const hover = slug =>
	document
		.querySelector( `#adminmenu a[href$="page=${ slug }"]` )
		.dispatchEvent( new Event( 'pointerover', { bubbles: true } ) );

beforeEach( () => {
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
			'guest-a': member( 'guest-a', 'a' ),
			'guest-b': member( 'guest-b', 'b' ),
			// Another page built from guest A's package: same init module.
			'guest-a2': member( 'guest-a2', 'a', null ),
		},
		guestAssetsUrl: '/wp-admin/admin-ajax.php',
		headerStorageKey: 'test',
	};
	document.body.innerHTML = `
		<ul id="adminmenu">
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

	it( 'reopens a hidden member without asking at the route it was left on', async () => {
		click( B );
		await settle();
		window.addEventListener( 'jetpack-admin-shell:before-leave', mockStay );
		click( A );
		await settle();

		expect( where() ).toBe( '?page=guest-a&p=%2Fone' );
		expect( mockStay.mock.calls.map( ( [ event ] ) => event.detail.page ) ).not.toContain(
			'guest-a'
		);
	} );

	it( 'keeps a member with unsaved changes on screen when its user stays on a menu click', async () => {
		window.addEventListener( 'jetpack-admin-shell:before-leave', mockStay );
		click( B );
		await settle();

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
		const { isolateRouters } = require( '../../../src/admin-shell/adapter' );
		const onPopState = isolateRouters.mock.results[ 0 ].value.listen.mock.calls.find(
			( [ type ] ) => type === 'popstate'
		)[ 1 ];
		const popTo = url => {
			globalThis.history.replaceState( null, '', url );
			onPopState( { isTrusted: true } );
		};
		click( B );
		await settle();
		window.addEventListener( 'jetpack-admin-shell:before-leave', mockStay );
		popTo( `${ A }&p=%2Fzero` );
		await settle();

		expect( mockStay ).toHaveBeenCalled();
		expect( where() ).toBe( '?page=guest-a&p=%2Fone' );
		expect( stateOf( 'guest-a' ) ).toBe( 'visible' );
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
