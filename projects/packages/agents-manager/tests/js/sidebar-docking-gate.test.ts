/**
 * Tests for the pre-paint sidebar-docking gate.
 *
 * The module under test is a self-invoking IIFE that runs its work the moment it
 * is imported, so each case sets up the DOM first and then imports the module in
 * isolation to trigger a fresh run.
 */

import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const MODULE_PATH = '../../src/js/sidebar-docking-gate';
const DOCKED_SIDEBAR_BODY_CLASSES = [
	'agents-manager-sidebar-container',
	'agents-manager-sidebar-container--sidebar-open',
];

/**
 * jsdom does not lay elements out, so offsetHeight is always 0. Stub it so the
 * gate's height math has something to measure.
 *
 * @param {HTMLElement} element - Element to stub.
 * @param {number}      value   - Pixel height to report.
 */
function stubOffsetHeight( element: HTMLElement, value: number ): void {
	Object.defineProperty( element, 'offsetHeight', {
		configurable: true,
		value,
	} );
}

/**
 * Set the viewport height the gate reads.
 *
 * @param {number} value - Pixel height for window.innerHeight.
 */
function setViewportHeight( value: number ): void {
	Object.defineProperty( window, 'innerHeight', {
		configurable: true,
		writable: true,
		value,
	} );
}

/**
 * Set the viewport width the gate reads.
 *
 * @param {number} value - Pixel width for window.innerWidth.
 */
function setViewportWidth( value: number ): void {
	Object.defineProperty( window, 'innerWidth', {
		configurable: true,
		writable: true,
		value,
	} );
}

/**
 * Add the optimistically-injected docked sidebar classes to the body so a run
 * has something to remove.
 */
function addDockedClasses(): void {
	document.body.classList.add( ...DOCKED_SIDEBAR_BODY_CLASSES );
}

/**
 * Import the module in isolation so the IIFE runs once against the current DOM.
 */
async function runGate(): Promise< void > {
	await jest.isolateModulesAsync( async () => {
		await import( MODULE_PATH );
	} );
}

/**
 * Let queued MutationObserver callbacks run.
 */
async function flushMutations(): Promise< void > {
	await new Promise( resolve => {
		setTimeout( resolve, 0 );
	} );
}

describe( 'sidebar-docking-gate', () => {
	beforeEach( () => {
		document.body.innerHTML = '';
		document.body.className = '';
		// Wide enough to clear the too-narrow gate unless a test overrides it.
		setViewportWidth( 1400 );
		jest.resetModules();
	} );

	it( 'removes the docked classes when the menu does not fit the viewport', async () => {
		addDockedClasses();

		const adminMenu = document.createElement( 'div' );
		adminMenu.id = 'adminmenu';
		stubOffsetHeight( adminMenu, 800 );
		document.body.appendChild( adminMenu );

		// 600 < 800 + 32 (default bar) + 20 => too short.
		setViewportHeight( 600 );

		await runGate();

		DOCKED_SIDEBAR_BODY_CLASSES.forEach( cls => {
			expect( document.body ).not.toHaveClass( cls );
		} );
	} );

	it( 'keeps the docked classes when the menu fits the viewport', async () => {
		addDockedClasses();

		const adminMenu = document.createElement( 'div' );
		adminMenu.id = 'adminmenu';
		stubOffsetHeight( adminMenu, 400 );
		document.body.appendChild( adminMenu );

		// 1000 >= 400 + 32 + 20 => fits.
		setViewportHeight( 1000 );

		await runGate();

		DOCKED_SIDEBAR_BODY_CLASSES.forEach( cls => {
			expect( document.body ).toHaveClass( cls );
		} );
	} );

	it( 'removes the docked classes when the viewport is too narrow', async () => {
		addDockedClasses();

		const adminMenu = document.createElement( 'div' );
		adminMenu.id = 'adminmenu';
		stubOffsetHeight( adminMenu, 400 );
		document.body.appendChild( adminMenu );

		// Tall enough to fit, but narrower than the 1200px threshold.
		setViewportHeight( 1000 );
		setViewportWidth( 1100 );

		await runGate();

		DOCKED_SIDEBAR_BODY_CLASSES.forEach( cls => {
			expect( document.body ).not.toHaveClass( cls );
		} );
	} );

	it( 'removes the docked classes on a fullscreen-gated page that is not in fullscreen mode', async () => {
		addDockedClasses();
		document.body.classList.add( 'post-php' );

		const adminMenu = document.createElement( 'div' );
		adminMenu.id = 'adminmenu';
		stubOffsetHeight( adminMenu, 400 );
		document.body.appendChild( adminMenu );

		// Fits and wide enough; only the fullscreen gate trips.
		setViewportHeight( 1000 );

		await runGate();

		DOCKED_SIDEBAR_BODY_CLASSES.forEach( cls => {
			expect( document.body ).not.toHaveClass( cls );
		} );
	} );

	it( 'keeps the docked classes on a fullscreen-gated page that is in fullscreen mode', async () => {
		addDockedClasses();
		document.body.classList.add( 'post-php', 'is-fullscreen-mode' );

		const adminMenu = document.createElement( 'div' );
		adminMenu.id = 'adminmenu';
		stubOffsetHeight( adminMenu, 400 );
		document.body.appendChild( adminMenu );

		setViewportHeight( 1000 );

		await runGate();

		DOCKED_SIDEBAR_BODY_CLASSES.forEach( cls => {
			expect( document.body ).toHaveClass( cls );
		} );
	} );

	it( 'does nothing when the admin menu is absent', async () => {
		addDockedClasses();
		setViewportHeight( 100 );

		await runGate();

		// The classes are left untouched because the gate bails out early.
		DOCKED_SIDEBAR_BODY_CLASSES.forEach( cls => {
			expect( document.body ).toHaveClass( cls );
		} );
	} );

	it( 'falls back to a 32px admin bar height when #wpadminbar is missing', async () => {
		addDockedClasses();

		const adminMenu = document.createElement( 'div' );
		adminMenu.id = 'adminmenu';
		stubOffsetHeight( adminMenu, 700 );
		document.body.appendChild( adminMenu );

		// Boundary with the 32px fallback: 760 >= 700 + 32 + 20 (752) => fits.
		setViewportHeight( 760 );
		await runGate();
		DOCKED_SIDEBAR_BODY_CLASSES.forEach( cls => {
			expect( document.body ).toHaveClass( cls );
		} );

		// One pixel under the fallback threshold => too short.
		document.body.className = '';
		addDockedClasses();
		jest.resetModules();
		setViewportHeight( 751 );
		await runGate();
		DOCKED_SIDEBAR_BODY_CLASSES.forEach( cls => {
			expect( document.body ).not.toHaveClass( cls );
		} );
	} );

	it( 'uses the real admin bar offsetHeight when #wpadminbar is present', async () => {
		addDockedClasses();

		const adminBar = document.createElement( 'div' );
		adminBar.id = 'wpadminbar';
		stubOffsetHeight( adminBar, 100 );
		document.body.appendChild( adminBar );

		const adminMenu = document.createElement( 'div' );
		adminMenu.id = 'adminmenu';
		stubOffsetHeight( adminMenu, 700 );
		document.body.appendChild( adminMenu );

		// With the taller real bar: 800 < 700 + 100 + 20 (820) => too short,
		// even though it would have fit with the 32px fallback.
		setViewportHeight( 800 );

		await runGate();

		DOCKED_SIDEBAR_BODY_CLASSES.forEach( cls => {
			expect( document.body ).not.toHaveClass( cls );
		} );
	} );

	it( 'strips the shell when a fullscreen-gated class is added after the first run', async () => {
		addDockedClasses();

		const adminMenu = document.createElement( 'div' );
		adminMenu.id = 'adminmenu';
		stubOffsetHeight( adminMenu, 400 );
		document.body.appendChild( adminMenu );
		setViewportHeight( 1000 );

		await runGate();

		// Not a gated screen yet, so the shell is kept on the first run.
		DOCKED_SIDEBAR_BODY_CLASSES.forEach( cls => {
			expect( document.body ).toHaveClass( cls );
		} );

		// The editor screen class lands later and we are not in fullscreen → strip.
		document.body.classList.add( 'post-php' );
		await flushMutations();

		DOCKED_SIDEBAR_BODY_CLASSES.forEach( cls => {
			expect( document.body ).not.toHaveClass( cls );
		} );
	} );

	it( 'keeps the shell when a gated class is added while in fullscreen mode', async () => {
		addDockedClasses();

		const adminMenu = document.createElement( 'div' );
		adminMenu.id = 'adminmenu';
		stubOffsetHeight( adminMenu, 400 );
		document.body.appendChild( adminMenu );
		setViewportHeight( 1000 );

		await runGate();

		document.body.classList.add( 'post-php', 'is-fullscreen-mode' );
		await flushMutations();

		DOCKED_SIDEBAR_BODY_CLASSES.forEach( cls => {
			expect( document.body ).toHaveClass( cls );
		} );
	} );

	it( 'stops observing once the chat app mounts', async () => {
		addDockedClasses();

		const adminMenu = document.createElement( 'div' );
		adminMenu.id = 'adminmenu';
		stubOffsetHeight( adminMenu, 400 );
		document.body.appendChild( adminMenu );
		setViewportHeight( 1000 );

		await runGate();

		// The app mounted and owns docking from here on.
		const portal = document.createElement( 'div' );
		portal.className = 'agents-manager-chat';
		document.body.appendChild( portal );

		// A late gated, non-fullscreen change would otherwise strip — but the gate
		// has handed off, so it leaves the shell for the app to manage.
		document.body.classList.add( 'post-php' );
		await flushMutations();

		DOCKED_SIDEBAR_BODY_CLASSES.forEach( cls => {
			expect( document.body ).toHaveClass( cls );
		} );
	} );

	it( 'disconnects after one strip and never loops or re-strips', async () => {
		addDockedClasses();

		const adminMenu = document.createElement( 'div' );
		adminMenu.id = 'adminmenu';
		stubOffsetHeight( adminMenu, 400 );
		document.body.appendChild( adminMenu );
		setViewportHeight( 1000 );

		await runGate();

		// A gated, non-fullscreen change lands → the observer strips once. The strip
		// mutates the class attribute; if it re-triggered itself, flushMutations()
		// would never settle and this test would hang.
		document.body.classList.add( 'post-php' );
		await flushMutations();
		DOCKED_SIDEBAR_BODY_CLASSES.forEach( cls => {
			expect( document.body ).not.toHaveClass( cls );
		} );

		// Re-add the shell on the still-gated body: a live observer would strip it
		// again, so its survival proves the observer disconnected after the strip.
		addDockedClasses();
		await flushMutations();
		DOCKED_SIDEBAR_BODY_CLASSES.forEach( cls => {
			expect( document.body ).toHaveClass( cls );
		} );
	} );
} );
