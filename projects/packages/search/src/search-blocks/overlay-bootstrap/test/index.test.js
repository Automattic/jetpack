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

/**
 * Import the bootstrap fresh and let the fire-and-forget `openOverlay` settle.
 */
async function loadBootstrap() {
	jest.resetModules();
	await import( '../index.js' );
	// `handlePopState` → `openOverlay` awaits hydration before toggling `hidden`;
	// flush the microtask queue so the attribute change has landed.
	await new Promise( resolve => setTimeout( resolve, 0 ) );
}

const isOpen = () => ! document.getElementById( OVERLAY_ID ).hasAttribute( 'hidden' );

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
	 * would otherwise trip `@wordpress/jest-console`'s strict error guard.
	 */
	async function setUpOpenOverlay() {
		window.scrollTo = () => {};
		setReadyState( 'complete' );
		renderOverlayShell( { full: true } );
		setUrl( '/?s=hello' );
		await loadBootstrap();
	}

	it( 'closes when the X close button is clicked', async () => {
		await setUpOpenOverlay();

		const closeBtn = document.querySelector( '.jetpack-search-block-overlay__close' );
		closeBtn.dispatchEvent( new MouseEvent( 'click', { bubbles: true } ) );

		expect( isOpen() ).toBe( false );
	} );

	it( 'closes when the scrim (outside the card) is clicked', async () => {
		await setUpOpenOverlay();

		document
			.getElementById( OVERLAY_ID )
			.dispatchEvent( new MouseEvent( 'click', { bubbles: true } ) );

		expect( isOpen() ).toBe( false );
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
