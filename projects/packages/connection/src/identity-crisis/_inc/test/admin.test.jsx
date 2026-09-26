// This tests a vanilla-DOM module, not a React component: the
// testing-library rules below assume RTL's `render()` API, which doesn't apply here.
/* eslint-disable testing-library/no-node-access, testing-library/no-dom-import, testing-library/render-result-naming-convention */
import { waitFor } from '@testing-library/dom';

jest.mock( '@automattic/jetpack-idc', () => ( {
	IDCScreen: () => <div data-testid="idc-screen" />,
} ) );

const SCREEN_SELECTOR = '[data-testid="idc-screen"]';

const INITIAL_STATE = {
	WP_API_root: 'https://example.com/wp-json/',
	WP_API_nonce: 'nonce',
	wpcomHomeUrl: 'https://example.com',
	currentUrl: 'https://example.com',
	redirectUri: '/',
	tracksUserData: {},
	tracksEventData: {},
	isSafeModeConfirmed: false,
	consumerData: {},
	isAdmin: true,
	possibleDynamicSiteUrlDetected: false,
	isDevelopmentSite: false,
	containerID: 'custom-idc-container',
};

/**
 * Load admin.jsx and return its exported `render`, with the module's own
 * `window` `load` listener swallowed — jsdom fires a real `load` event on
 * every test, which would otherwise call render() a second time and mask
 * what these tests exercise.
 *
 * @return {Function} The module's `render` export.
 */
function loadRender() {
	const realAddEventListener = window.addEventListener.bind( window );
	jest.spyOn( window, 'addEventListener' ).mockImplementation( ( type, listener, options ) => {
		if ( type === 'load' ) {
			return;
		}
		return realAddEventListener( type, listener, options );
	} );

	return require( '../admin' ).render;
}

describe( 'render()', () => {
	beforeEach( () => {
		jest.resetModules();
		document.body.innerHTML = '';
		window.JP_IDENTITY_CRISIS__INITIAL_STATE = { ...INITIAL_STATE };
	} );

	afterEach( () => {
		delete window.JP_IDENTITY_CRISIS__INITIAL_STATE;
		jest.useRealTimers();
	} );

	it( 'mounts once a dashboard adds the container after load', async () => {
		const render = loadRender();
		render();
		expect( document.querySelector( SCREEN_SELECTOR ) ).not.toBeInTheDocument();

		const container = document.createElement( 'div' );
		container.id = INITIAL_STATE.containerID;
		document.body.appendChild( container );

		await waitFor( () => {
			expect( document.querySelector( SCREEN_SELECTOR ) ).toBeInTheDocument();
		} );
	} );

	it( 'disconnects its observer after the timeout, so it stops watching', () => {
		jest.useFakeTimers();
		const disconnect = jest.spyOn( MutationObserver.prototype, 'disconnect' );
		const render = loadRender();
		render();

		expect( disconnect ).not.toHaveBeenCalled();
		jest.advanceTimersByTime( 30000 );
		expect( disconnect ).toHaveBeenCalledTimes( 1 );
	} );
} );
