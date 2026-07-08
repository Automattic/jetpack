import { playerBridgeHandler } from '../index';

/**
 * Create a synthetic MessageEvent for testing.
 *
 * @param {object} root0        - Options.
 * @param {object} root0.data   - Event data payload.
 * @param {string} root0.origin - Event origin URL.
 * @return {MessageEvent} The constructed event.
 */
function createMessageEvent( {
	data = {},
	origin = 'https://videopress.com',
}: {
	data?: Record< string, unknown >;
	origin?: string;
} = {} ): MessageEvent {
	return new MessageEvent( 'message', {
		data,
		origin,
	} );
}

describe( 'playerBridgeHandler', () => {
	let mockTopPostMessage: jest.SpyInstance;
	let mockIframePostMessage: jest.Mock;

	beforeEach( () => {
		jest.clearAllMocks();

		// Spy on window.top.postMessage (window.top === window in jsdom).
		mockTopPostMessage = jest.spyOn( window.top, 'postMessage' ).mockImplementation( () => {} );

		// Create a mock iframe for the emitting path.
		mockIframePostMessage = jest.fn();
		const mockIframe = document.createElement( 'iframe' );
		Object.defineProperty( mockIframe, 'contentWindow', {
			value: { postMessage: mockIframePostMessage },
			configurable: true,
		} );
		document.body.appendChild( mockIframe );
	} );

	afterEach( () => {
		mockTopPostMessage.mockRestore();

		// Clean up iframes.
		document.querySelectorAll( 'iframe' ).forEach( el => el.remove() );
	} );

	describe( 'listening path (player -> editor)', () => {
		it( 'relays allowed events from valid origins to window.top', async () => {
			const event = createMessageEvent( {
				data: { event: 'videopress_playing' },
				origin: 'https://videopress.com',
			} );

			await playerBridgeHandler( event );

			expect( mockTopPostMessage ).toHaveBeenCalledWith( { event: 'videopress_playing' }, '*' );
		} );

		it( 'relays events from video.wordpress.com', async () => {
			const event = createMessageEvent( {
				data: { event: 'videopress_pause' },
				origin: 'https://video.wordpress.com',
			} );

			await playerBridgeHandler( event );

			expect( mockTopPostMessage ).toHaveBeenCalledWith( { event: 'videopress_pause' }, '*' );
		} );

		it( 'rejects listening events from disallowed origins', async () => {
			const event = createMessageEvent( {
				data: { event: 'videopress_playing' },
				origin: 'https://evil.com',
			} );

			await playerBridgeHandler( event );

			expect( mockTopPostMessage ).not.toHaveBeenCalled();
		} );

		it( 'rejects events not in the allowed listening list', async () => {
			const event = createMessageEvent( {
				data: { event: 'videopress_unknown_event' },
				origin: 'https://videopress.com',
			} );

			await playerBridgeHandler( event );

			expect( mockTopPostMessage ).not.toHaveBeenCalled();
			expect( mockIframePostMessage ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'emitting path (editor -> player)', () => {
		it( 'forwards allowed action events to iframe', async () => {
			const event = createMessageEvent( {
				data: { event: 'videopress_action_play' },
				origin: 'https://videopress.com',
			} );

			await playerBridgeHandler( event );

			expect( mockIframePostMessage ).toHaveBeenCalledWith(
				{ event: 'videopress_action_play' },
				'*'
			);
		} );

		it( 'accepts action events from any origin (embedding sites)', async () => {
			const event = createMessageEvent( {
				data: { event: 'videopress_action_play' },
				origin: 'https://example.com',
			} );

			await playerBridgeHandler( event );

			expect( mockIframePostMessage ).toHaveBeenCalledWith(
				{ event: 'videopress_action_play' },
				'*'
			);
		} );

		it( 'does nothing when no iframe exists', async () => {
			// Remove all iframes.
			document.querySelectorAll( 'iframe' ).forEach( el => el.remove() );

			const event = createMessageEvent( {
				data: { event: 'videopress_action_pause' },
				origin: 'https://videopress.com',
			} );

			await playerBridgeHandler( event );

			expect( mockIframePostMessage ).not.toHaveBeenCalled();
		} );
	} );
} );
