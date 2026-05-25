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
 */
function renderOverlayShell() {
	document.body.innerHTML = `
		<div id="${ OVERLAY_ID }" hidden>
			<div class="jetpack-search-block-overlay__content"></div>
		</div>
		<template id="jetpack-search-block-overlay-template"></template>
	`;
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
