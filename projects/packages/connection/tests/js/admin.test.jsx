/**
 * Tests for the identity-crisis banner's container selection.
 *
 * The module under test renders on `window`'s `load` event, which jsdom also fires for
 * real. `addEventListener` is stubbed before the module loads, so only the captured
 * callback — called explicitly per test — runs the render.
 */
import { beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act } from 'react';

jest.mock( '@automattic/jetpack-idc', () => ( {
	IDCScreen: () => <div data-testid="idc-screen" />,
} ) );

jest.mock( '@wordpress/components', () => ( {
	Modal: ( { children } ) => <div data-testid="idc-modal">{ children }</div>,
} ) );

const baseState = {
	WP_API_root: 'https://example.com/wp-json/',
	WP_API_nonce: 'nonce',
	wpcomHomeUrl: 'https://example.com',
	currentUrl: 'https://example.org',
	redirectUri: '/wp-admin/',
	tracksUserData: {},
	tracksEventData: {},
	isSafeModeConfirmed: false,
	consumerData: {},
	isAdmin: true,
	possibleDynamicSiteUrlDetected: false,
	isDevelopmentSite: false,
	containerID: null,
};

/**
 * Mark an element as hidden or visible for the module's `getClientRects()` check.
 *
 * @param {Element} element - The element to stub.
 * @param {boolean} visible - Whether it should appear rendered.
 */
function setVisible( element, visible ) {
	element.getClientRects = () => ( visible ? [ {} ] : [] );
}

let triggerLoad;

// Lets `act()` flush synchronously; unset by default outside React's own test setup.
global.IS_REACT_ACT_ENVIRONMENT = true;

// Captured once: the callback reads window/DOM state fresh on every call, so every
// test can reuse it. A static top-level import would run before the spy is set up.
beforeAll( async () => {
	const addEventListenerSpy = jest
		.spyOn( window, 'addEventListener' )
		.mockImplementation( () => {} );

	await import( '../../src/identity-crisis/_inc/admin.jsx' );

	const [ , callback ] = addEventListenerSpy.mock.calls.find( ( [ name ] ) => name === 'load' );
	triggerLoad = callback;
	addEventListenerSpy.mockRestore();
} );

describe( 'identity-crisis admin.jsx', () => {
	beforeEach( () => {
		document.body.innerHTML = '';
		delete window.JP_IDENTITY_CRISIS__INITIAL_STATE;
	} );

	it( 'mounts in a body-level modal when the default container is hidden', () => {
		document.body.innerHTML = '<div id="jp-identity-crisis-container"></div>';
		const container = document.getElementById( 'jp-identity-crisis-container' );
		setVisible( container, false );
		window.JP_IDENTITY_CRISIS__INITIAL_STATE = { ...baseState };

		act( () => triggerLoad() );

		expect( container ).toBeEmptyDOMElement();
		expect( document.body.querySelector( '[data-testid="idc-modal"]' ) ).toBeInTheDocument();
		expect( document.body.querySelector( '[data-testid="idc-screen"]' ) ).toBeInTheDocument();
	} );

	it( 'mounts inline when the default container is visible', () => {
		document.body.innerHTML = '<div id="jp-identity-crisis-container"></div>';
		const container = document.getElementById( 'jp-identity-crisis-container' );
		setVisible( container, true );
		window.JP_IDENTITY_CRISIS__INITIAL_STATE = { ...baseState };

		act( () => triggerLoad() );

		expect( container.querySelector( '[data-testid="idc-screen"]' ) ).toBeInTheDocument();
		expect( document.body.querySelector( '[data-testid="idc-modal"]' ) ).not.toBeInTheDocument();
	} );

	it( 'mounts inline into a custom container even when hidden', () => {
		document.body.innerHTML = '<div id="custom-container"></div>';
		const container = document.getElementById( 'custom-container' );
		setVisible( container, false );
		window.JP_IDENTITY_CRISIS__INITIAL_STATE = { ...baseState, containerID: 'custom-container' };

		act( () => triggerLoad() );

		expect( container.querySelector( '[data-testid="idc-screen"]' ) ).toBeInTheDocument();
		expect( document.body.querySelector( '[data-testid="idc-modal"]' ) ).not.toBeInTheDocument();
	} );
} );
