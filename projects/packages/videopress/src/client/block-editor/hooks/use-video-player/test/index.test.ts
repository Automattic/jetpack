import { renderHook, act } from '@testing-library/react';
import useVideoPlayer, { getIframeWindowFromRef } from '../index';
import type { RefObject } from 'react';

jest.mock( 'debug', () => () => jest.fn() );
jest.mock( '@wordpress/compose', () => ( {
	usePrevious: () => undefined,
} ) );

/**
 * Create a div ref wrapping an iframe.components-sandbox whose contentWindow
 * is the real jsdom `window`, so event listeners added by the hook fire when
 * we dispatch on `window`.
 *
 * @return {RefObject< HTMLDivElement >} The constructed ref.
 */
function createIframeRef(): RefObject< HTMLDivElement > {
	const wrapper = document.createElement( 'div' );
	const iframe = document.createElement( 'iframe' );
	iframe.className = 'components-sandbox';
	Object.defineProperty( iframe, 'contentWindow', {
		value: window,
		configurable: true,
	} );
	wrapper.appendChild( iframe );
	document.body.appendChild( wrapper );
	return { current: wrapper } as RefObject< HTMLDivElement >;
}

describe( 'getIframeWindowFromRef', () => {
	it( 'returns undefined when the wrapper contains no sandbox iframe', () => {
		const wrapper = document.createElement( 'div' );
		const ref = { current: wrapper } as RefObject< HTMLDivElement >;
		expect( getIframeWindowFromRef( ref ) ).toBeUndefined();
	} );

	it( 'returns the contentWindow of iframe.components-sandbox', () => {
		const wrapper = document.createElement( 'div' );
		const iframe = document.createElement( 'iframe' );
		iframe.className = 'components-sandbox';
		const mockContentWindow = { postMessage: jest.fn() } as unknown as Window;
		Object.defineProperty( iframe, 'contentWindow', {
			value: mockContentWindow,
			configurable: true,
		} );
		wrapper.appendChild( iframe );
		const ref = { current: wrapper } as RefObject< HTMLDivElement >;
		expect( getIframeWindowFromRef( ref ) ).toBe( mockContentWindow );
	} );
} );

/**
 * Dispatch a message event on window, simulating a message from an iframe.
 *
 * @param {object} root0        - Options.
 * @param {object} root0.data   - Event data payload.
 * @param {string} root0.origin - Event origin URL.
 * @param {Window} root0.source - Event source window.
 */
function dispatchPlayerMessage( {
	data,
	origin = 'https://videopress.com',
	source = window,
}: {
	data: Record< string, unknown >;
	origin?: string;
	source?: Window | null;
} ) {
	window.dispatchEvent( new MessageEvent( 'message', { data, origin, source } ) );
}

describe( 'useVideoPlayer — listenEventsHandler guards', () => {
	let iFrameRef: RefObject< HTMLDivElement >;

	beforeEach( () => {
		iFrameRef = createIframeRef();
	} );

	afterEach( () => {
		document.body.innerHTML = '';
	} );

	it( 'sets playerIsReady after the full load + play sequence from a trusted origin', () => {
		const { result } = renderHook( () =>
			useVideoPlayer( iFrameRef, false, { initialTimePosition: 0 } )
		);

		act( () => {
			// Step 1: signal the player has loaded.
			dispatchPlayerMessage( { data: { event: 'videopress_loading_state', state: 'loaded' } } );
			// Step 2: signal first play — this triggers setPlayerIsReady(true).
			dispatchPlayerMessage( { data: { event: 'videopress_playing' } } );
		} );

		expect( result.current.playerIsReady ).toBe( true );
	} );

	it( 'ignores messages from untrusted origins', () => {
		const { result } = renderHook( () =>
			useVideoPlayer( iFrameRef, false, { initialTimePosition: 0 } )
		);

		act( () => {
			// Full sequence from an untrusted origin — should be ignored entirely.
			dispatchPlayerMessage( {
				data: { event: 'videopress_loading_state', state: 'loaded' },
				origin: 'https://evil.com',
			} );
			dispatchPlayerMessage( {
				data: { event: 'videopress_playing' },
				origin: 'https://evil.com',
			} );
		} );

		// Origin guard fires — playerIsReady stays false.
		expect( result.current.playerIsReady ).toBe( false );
	} );

	it( 'ignores messages with a missing source', () => {
		const { result } = renderHook( () =>
			useVideoPlayer( iFrameRef, false, { initialTimePosition: 0 } )
		);

		act( () => {
			// The loading state message has no source, so the source guard should fire.
			dispatchPlayerMessage( {
				data: { event: 'videopress_loading_state', state: 'loaded' },
				source: null,
			} );
			// A subsequent play event from a trusted source should not mark ready
			// because the state was never advanced to 'loaded'.
			dispatchPlayerMessage( { data: { event: 'videopress_playing' } } );
		} );

		// Source guard fired on the loading event — playerIsReady stays false.
		expect( result.current.playerIsReady ).toBe( false );
	} );
} );
