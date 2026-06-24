/**
 * Tests for the Search blocks overlay bootstrap's initial-load URL trigger.
 *
 * The module runs side effects at import time (registers listeners and syncs
 * the overlay to the current URL), so each case sets up the DOM + URL +
 * `document.readyState`, then imports the module fresh via `jest.resetModules`.
 */

let mockActions;
let mockApis;
let mockResolveInitialVdom;

// `ensureHydrated()` dynamically imports this; stub the private API shape so
// bootstrap timing can be tested without reaching for the real Interactivity
// runtime in jsdom.
jest.mock(
	'@wordpress/interactivity',
	() => ( {
		privateApis: jest.fn( () => mockApis ),
		store: jest.fn( () => ( { actions: mockActions } ) ),
	} ),
	{ virtual: true }
);
// The bootstrap statically depends on the shared store as a side-effect
// import (so the runtime store registers before the bootstrap dispatches
// `dispatchInitialSearchIfNeeded` after hydration). The store module itself
// is exercised in `tests/js/search-blocks/store.test.js`; here it would just
// pull in the real Interactivity API and unrelated build paths, so stub it.
jest.mock( 'jetpack-search/store', () => ( {} ), { virtual: true } );

const OVERLAY_ID = 'jetpack-search-block-overlay';

/**
 * Render the server-side overlay shell (closed) into the document body.
 *
 * @param {object}  [options]      - Shell variants.
 * @param {boolean} [options.full] - When true, include the card + close button + a nested suggestion-row marker for the dismissal tests.
 */
function renderOverlayShell( { full = false } = {} ) {
	const inner = full
		? `
			<div class="jetpack-search-block-overlay__card">
				<button class="jetpack-search-block-overlay__close" type="button">close</button>
				<div class="jetpack-search-block-overlay__content">
					<ul class="jetpack-search-input__suggestions">
						<li class="jetpack-search-input__suggestions-option" id="suggestion-row"></li>
					</ul>
				</div>
			</div>
		`
		: `<div class="jetpack-search-block-overlay__content"></div>`;
	document.body.innerHTML = `
		<div id="${ OVERLAY_ID }">${ inner }</div>
		<template id="jetpack-search-block-overlay-template"></template>
	`;
	document.getElementById( OVERLAY_ID ).setAttribute( 'hidden', '' );
}

/**
 * Reset the mocked Interactivity private API for a fresh bootstrap import.
 */
function resetInteractivityMock() {
	mockActions = {
		closeAllPopovers: jest.fn(),
		dispatchInitialSearchIfNeeded: jest.fn(),
	};
	mockApis = {
		getRegionRootFragment: jest.fn( region => region.parentElement ),
		initialVdomPromise: new Promise( resolve => {
			mockResolveInitialVdom = resolve;
		} ),
		render: jest.fn(),
		toVdom: jest.fn( region => region ),
	};
}

/**
 * Point `window.location` at the given path+query without a real navigation.
 *
 * @param {string} url - Path with optional query string, e.g. `/?s=foo`.
 */
function setUrl( url ) {
	window.history.replaceState( {}, '', url );
}

/**
 * Override `document.readyState` for the duration of a test.
 *
 * @param {string} value - `'loading'`, `'interactive'`, or `'complete'`.
 */
function setReadyState( value ) {
	Object.defineProperty( document, 'readyState', {
		configurable: true,
		get: () => value,
	} );
}

/**
 * Import the bootstrap fresh and let the fire-and-forget `openOverlay` settle.
 *
 * @param {object}  [options]                         - Import options.
 * @param {boolean} [options.resolveInitialHydration] - Whether to resolve the mocked initial hydration before flushing.
 */
async function loadBootstrap( { resolveInitialHydration = true } = {} ) {
	jest.resetModules();
	await import( '../index.js' );
	if ( resolveInitialHydration ) {
		mockResolveInitialVdom( new WeakMap() );
	}
	// `handlePopState` → `openOverlay` awaits hydration before toggling `hidden`;
	// flush the microtask queue so the attribute change has landed.
	await new Promise( resolve => setTimeout( resolve, 0 ) );
}

const isOpen = () => ! document.getElementById( OVERLAY_ID ).hasAttribute( 'hidden' );

// jsdom locks `window.location.reload` (non-configurable, non-writable, on the
// instance — not the prototype), and `window.location` itself can't be
// redefined. Invoking `reload()` emits a "Not implemented: navigation to
// another Document" `console.error`. Reload-path tests assert
// `expect( console ).toHaveErrored()` as evidence the call fired — that doubles
// as the declaration that satisfies the jest-console strict guard.

beforeEach( () => {
	resetInteractivityMock();
} );

afterEach( () => {
	setReadyState( 'complete' );
	setUrl( '/' );
	document.body.innerHTML = '';
} );

describe( 'overlay-bootstrap initial-load URL trigger', () => {
	it( 'opens the overlay on initial load when the URL has ?s=', async () => {
		setReadyState( 'complete' );
		renderOverlayShell();
		setUrl( '/?s=hello' );

		await loadBootstrap();

		expect( isOpen() ).toBe( true );
	} );

	it( 'opens the overlay on initial load when the URL has ?q=', async () => {
		setReadyState( 'complete' );
		renderOverlayShell();
		setUrl( '/?q=hello' );

		await loadBootstrap();

		expect( isOpen() ).toBe( true );
	} );

	it( 'leaves the overlay closed when the URL has no search param', async () => {
		setReadyState( 'complete' );
		renderOverlayShell();
		setUrl( '/' );

		await loadBootstrap();

		expect( isOpen() ).toBe( false );
	} );

	it( 'waits for DOMContentLoaded when the document is still loading', async () => {
		setReadyState( 'loading' );
		renderOverlayShell();
		setUrl( '/?s=hello' );

		await loadBootstrap();
		// Still parsing — the overlay must not open yet.
		expect( isOpen() ).toBe( false );

		document.dispatchEvent( new Event( 'DOMContentLoaded' ) );
		await new Promise( resolve => setTimeout( resolve, 0 ) );

		expect( isOpen() ).toBe( true );
	} );

	it( 'waits for the initial Interactivity hydration before cloning the overlay template', async () => {
		setReadyState( 'complete' );
		renderOverlayShell();
		document.getElementById( 'jetpack-search-block-overlay-template' ).innerHTML =
			'<div data-wp-interactive="jetpack-search" id="clone-marker"></div>';
		setUrl( '/?s=hello' );

		await loadBootstrap( { resolveInitialHydration: false } );

		expect( isOpen() ).toBe( false );
		expect( document.getElementById( 'clone-marker' ) ).toBeNull();

		mockResolveInitialVdom( new WeakMap() );
		await new Promise( resolve => setTimeout( resolve, 0 ) );

		expect( isOpen() ).toBe( true );
		expect( document.getElementById( 'clone-marker' ) ).not.toBeNull();
		expect( mockApis.render ).toHaveBeenCalled();
		expect( mockActions.dispatchInitialSearchIfNeeded ).toHaveBeenCalled();
	} );

	it( 'is a no-op when the overlay shell is not rendered', async () => {
		setReadyState( 'complete' );
		document.body.innerHTML = '';
		setUrl( '/?s=hello' );

		await expect( loadBootstrap() ).resolves.toBeUndefined();
		expect( document.getElementById( OVERLAY_ID ) ).toBeNull();
	} );
} );

describe( 'overlay-bootstrap click dismissal', () => {
	/**
	 * Render the full overlay, open it via the URL trigger, and stub
	 * `window.scrollTo` (which `closeOverlay` calls when restoring scroll
	 * position). jsdom doesn't implement scrollTo and the close-path tests
	 * would otherwise trip the jest-console strict error guard.
	 *
	 * @param {string} [initialUrl] - Path+query to load the bootstrap against.
	 *                              Defaults to `?s=hello` so the overlay opens
	 *                              via the URL trigger.
	 */
	async function setUpOpenOverlay( initialUrl = '/?s=hello' ) {
		window.scrollTo = () => {};
		setReadyState( 'complete' );
		renderOverlayShell( { full: true } );
		setUrl( initialUrl );
		await loadBootstrap();
	}

	it( 'closes when the X close button is clicked', async () => {
		await setUpOpenOverlay();

		const closeBtn = document.querySelector( '.jetpack-search-block-overlay__close' );
		closeBtn.dispatchEvent( new MouseEvent( 'click', { bubbles: true } ) );

		// `?s=hello` was present, so the close path reloads and the DOM-hide
		// branch is skipped. We can't observe `hidden` here because
		// `closeOverlay()` returns immediately after `reload()`.
		expect( console ).toHaveErrored();
	} );

	it( 'closes when the scrim (outside the card) is clicked', async () => {
		await setUpOpenOverlay();

		document
			.getElementById( OVERLAY_ID )
			.dispatchEvent( new MouseEvent( 'click', { bubbles: true } ) );

		expect( console ).toHaveErrored();
	} );

	it( 'stays open when a click target inside the card is detached mid-bubble', async () => {
		// Reproduces the suggestion-click bug: the `<li>` lives inside the card,
		// but the Interactivity action that fires on click empties the surrounding
		// `data-wp-each` array, which removes the `<li>` from the DOM before the
		// click event finishes bubbling to the overlay's outside-click handler.
		// `event.target.closest('.jetpack-search-block-overlay__card')` then returns
		// null and the overlay dismisses. With `composedPath()` the path is frozen
		// at dispatch time, so the detach no longer fools the handler.
		await setUpOpenOverlay();

		const row = document.getElementById( 'suggestion-row' );
		row.addEventListener( 'click', () => row.remove() );
		row.dispatchEvent( new MouseEvent( 'click', { bubbles: true } ) );

		expect( isOpen() ).toBe( true );
	} );

	it( 'stays open when a non-suggestion click inside the card bubbles up', async () => {
		await setUpOpenOverlay();

		document
			.querySelector( '.jetpack-search-block-overlay__content' )
			.dispatchEvent( new MouseEvent( 'click', { bubbles: true } ) );

		expect( isOpen() ).toBe( true );
	} );
} );

describe( 'overlay-bootstrap close URL behavior', () => {
	beforeEach( () => {
		window.scrollTo = () => {};
	} );

	/**
	 * Open the overlay against the given URL and trigger a close-button click.
	 *
	 * @param {string} initialUrl - Path+query to start at.
	 * @return {Promise<void>}
	 */
	async function closeFrom( initialUrl ) {
		setReadyState( 'complete' );
		renderOverlayShell( { full: true } );
		setUrl( initialUrl );
		await loadBootstrap();
		document
			.querySelector( '.jetpack-search-block-overlay__close' )
			.dispatchEvent( new MouseEvent( 'click', { bubbles: true } ) );
	}

	it( 'strips ?s= and reloads when closing from a searched URL', async () => {
		await closeFrom( '/?s=hello' );

		expect( window.location.search ).toBe( '' );
		expect( console ).toHaveErrored();
	} );

	it( 'strips array-shaped filter params alongside the search query', async () => {
		await closeFrom( '/?s=hello&category[]=news&category[]=blog&query_type_category=and' );

		const params = new URLSearchParams( window.location.search );
		expect( params.has( 's' ) ).toBe( false );
		expect( params.has( 'category[]' ) ).toBe( false );
		expect( params.has( 'query_type_category' ) ).toBe( false );
		expect( console ).toHaveErrored();
	} );

	it( 'strips the scalar post_type alias on a product search close', async () => {
		await closeFrom( '/?s=shirt&post_type=product' );

		const params = new URLSearchParams( window.location.search );
		expect( params.has( 's' ) ).toBe( false );
		expect( params.has( 'post_type' ) ).toBe( false );
		expect( console ).toHaveErrored();
	} );

	it( 'preserves non-search params and the hash', async () => {
		await closeFrom( '/page/?s=hello&utm_source=twitter#anchor' );

		const params = new URLSearchParams( window.location.search );
		expect( params.has( 's' ) ).toBe( false );
		expect( params.get( 'utm_source' ) ).toBe( 'twitter' );
		expect( window.location.pathname ).toBe( '/page/' );
		expect( window.location.hash ).toBe( '#anchor' );
		expect( console ).toHaveErrored();
	} );

	it( 'does not reload when closing with no search params (manual trigger close)', async () => {
		// No `?s=`/`?q=` means the URL-trigger doesn't auto-open. Simulate an
		// open by removing `hidden` directly, then close — verifies the
		// no-strip → no-reload branch end-to-end.
		setReadyState( 'complete' );
		renderOverlayShell( { full: true } );
		setUrl( '/' );
		await loadBootstrap();
		document.getElementById( OVERLAY_ID ).removeAttribute( 'hidden' );

		document
			.querySelector( '.jetpack-search-block-overlay__close' )
			.dispatchEvent( new MouseEvent( 'click', { bubbles: true } ) );

		// No params to strip → no reload, overlay hides via the DOM path.
		expect( isOpen() ).toBe( false );
	} );

	it( 'reloads on Escape close when the URL carried search params', async () => {
		setReadyState( 'complete' );
		renderOverlayShell( { full: true } );
		setUrl( '/?s=hello' );
		await loadBootstrap();

		document.dispatchEvent( new KeyboardEvent( 'keydown', { key: 'Escape', bubbles: true } ) );

		expect( console ).toHaveErrored();
	} );
} );
