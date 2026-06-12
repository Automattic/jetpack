/**
 * Tests for the pre-paint dock-height reconciler.
 *
 * The module under test is a self-invoking IIFE that runs its work the moment it
 * is imported, so each case sets up the DOM first and then imports the module in
 * isolation to trigger a fresh run.
 */

import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const MODULE_PATH = '../../src/js/sidebar-dock-reconciler';
const TOO_SHORT_CLASS = 'agents-manager--viewport-height-too-short-for-docking';

/**
 * jsdom does not lay elements out, so offsetHeight is always 0. Stub it so the
 * reconciler's height math has something to measure.
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
 * Set the viewport height the reconciler reads.
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
 * Import the module in isolation so the IIFE runs once against the current DOM.
 */
async function runReconciler(): Promise< void > {
	await jest.isolateModulesAsync( async () => {
		await import( MODULE_PATH );
	} );
}

describe( 'sidebar-dock-reconciler', () => {
	beforeEach( () => {
		document.body.innerHTML = '';
		document.body.className = '';
		jest.resetModules();
	} );

	it( 'adds the too-short class when the menu does not fit the viewport', async () => {
		const adminMenu = document.createElement( 'div' );
		adminMenu.id = 'adminmenu';
		stubOffsetHeight( adminMenu, 800 );
		document.body.appendChild( adminMenu );

		// 600 < 800 + 32 (default bar) + 20 => too short.
		setViewportHeight( 600 );

		await runReconciler();

		expect( document.body ).toHaveClass( TOO_SHORT_CLASS );
	} );

	it( 'removes the too-short class when the menu fits the viewport', async () => {
		document.body.classList.add( TOO_SHORT_CLASS );

		const adminMenu = document.createElement( 'div' );
		adminMenu.id = 'adminmenu';
		stubOffsetHeight( adminMenu, 400 );
		document.body.appendChild( adminMenu );

		// 1000 >= 400 + 32 + 20 => fits.
		setViewportHeight( 1000 );

		await runReconciler();

		expect( document.body ).not.toHaveClass( TOO_SHORT_CLASS );
	} );

	it( 'does nothing when the admin menu is absent', async () => {
		document.body.classList.add( TOO_SHORT_CLASS );
		setViewportHeight( 100 );

		await runReconciler();

		// The class is left untouched because the reconciler bails out early.
		expect( document.body ).toHaveClass( TOO_SHORT_CLASS );
	} );

	it( 'falls back to a 32px admin bar height when #wpadminbar is missing', async () => {
		const adminMenu = document.createElement( 'div' );
		adminMenu.id = 'adminmenu';
		stubOffsetHeight( adminMenu, 700 );
		document.body.appendChild( adminMenu );

		// Boundary with the 32px fallback: 760 >= 700 + 32 + 20 (752) => fits.
		setViewportHeight( 760 );
		await runReconciler();
		expect( document.body ).not.toHaveClass( TOO_SHORT_CLASS );

		// One pixel under the fallback threshold => too short.
		document.body.className = '';
		jest.resetModules();
		setViewportHeight( 751 );
		await runReconciler();
		expect( document.body ).toHaveClass( TOO_SHORT_CLASS );
	} );

	it( 'uses the real admin bar offsetHeight when #wpadminbar is present', async () => {
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

		await runReconciler();

		expect( document.body ).toHaveClass( TOO_SHORT_CLASS );
	} );
} );
