/**
 * Tests for the Search blocks overlay bootstrap's initial-load URL trigger.
 *
 * The module runs side effects at import time (registers listeners and syncs
 * the overlay to the current URL), so each case sets up the DOM + URL +
 * `document.readyState`, then imports the module fresh via `jest.resetModules`.
 */

// `ensureHydrated()` dynamically imports this; stub it so the hydration branch
// no-ops instead of reaching for the real Interactivity runtime in jsdom.
jest.mock( '@wordpress/interactivity', () => ( {} ), { virtual: true } );
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

// Queue rAF callbacks rather than running them, so a test can observe the
// pre-frame state (the open is deferred) and then advance the frame explicitly.
// jsdom's real rAF fires on a ~16ms timer the `setTimeout(0)` flush doesn't
// await, and a stray late callback would leak into the next test.
let rafQueue = [];

/**
 * Run and clear every queued animation-frame callback.
 */
function flushAnimationFrames() {
	const callbacks = rafQueue;
	rafQueue = [];
	callbacks.forEach( cb => cb( 0 ) );
}

/**
 * Import the bootstrap fresh, run the deferred initial-load open, and let the
 * fire-and-forget `openOverlay` settle.
 */
async function loadBootstrap() {
	jest.resetModules();
	await import( '../index.js' );
	// The initial-load open is queued on `requestAnimationFrame`; run it, then
	// flush the microtask queue so `openOverlay`'s post-hydration `hidden`
	// toggle has landed.
	flushAnimationFrames();
	await new Promise( resolve => setTimeout( resolve, 0 ) );
}

const isOpen = () => ! document.getElementById( OVERLAY_ID ).hasAttribute( 'hidden' );

// jsdom locks `window.location.reload` (non-configurable, non-writable, on the
// instance — not the prototype), and `window.location` itself can't be
// redefined. Invoking `reload()` emits a "Not implemented: navigation to
// another Document" `console.error`. Reload-path tests assert
// `expect( console ).toHaveErrored()` as evidence the call fired — that doubles
// as the declaration that satisfies the jest-console strict guard.

let rafSpy;
beforeEach( () => {
	rafQueue = [];
	rafSpy = jest.spyOn( window, 'requestAnimationFrame' ).mockImplementation( cb => {
		rafQueue.push( cb );
		return rafQueue.length;
	} );
} );

afterEach( () => {
	rafSpy.mockRestore();
	rafQueue = [];
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

	it( 'opens immediately when the document is interactive (DOMContentLoaded already fired)', async () => {
		// readyState stays `interactive` from DOMContentLoaded until `load`, so a
		// late-evaluating module can land here after DCL has already fired —
		// waiting on a fresh DOMContentLoaded would hang. The non-loading branch
		// must open without depending on another DOMContentLoaded.
		setReadyState( 'interactive' );
		renderOverlayShell();
		setUrl( '/?s=hello' );

		await loadBootstrap();

		expect( isOpen() ).toBe( true );
	} );

	it( 'waits for DOMContentLoaded when the document is still loading', async () => {
		setReadyState( 'loading' );
		renderOverlayShell();
		setUrl( '/?s=hello' );

		await loadBootstrap();
		// Still parsing — the overlay must not open yet.
		expect( isOpen() ).toBe( false );

		document.dispatchEvent( new Event( 'DOMContentLoaded' ) );
		flushAnimationFrames();
		await new Promise( resolve => setTimeout( resolve, 0 ) );

		expect( isOpen() ).toBe( true );
	} );

	it( 'defers the initial-load open to an animation frame rather than opening synchronously', async () => {
		// The deferral is the fix: it keeps the cloned overlay regions out of the
		// Interactivity runtime's DOMContentLoaded hydration walk (a synchronous
		// open double-hydrates them and detaches the result/filter bindings). So
		// after the module evaluates the overlay must still be closed — it only
		// opens once the queued animation frame runs.
		setReadyState( 'complete' );
		renderOverlayShell();
		setUrl( '/?s=hello' );

		jest.resetModules();
		await import( '../index.js' );
		await new Promise( resolve => setTimeout( resolve, 0 ) );

		expect( window.requestAnimationFrame ).toHaveBeenCalled();
		expect( isOpen() ).toBe( false );

		flushAnimationFrames();
		await new Promise( resolve => setTimeout( resolve, 0 ) );

		expect( isOpen() ).toBe( true );
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
