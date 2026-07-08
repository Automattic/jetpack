const mockGetMediaToken = jest.fn();

jest.mock( '../../get-media-token', () => ( {
	__esModule: true,
	default: ( ...args ) => mockGetMediaToken( ...args ),
} ) );

// MessagePort is not available in jsdom; provide a stub so `instanceof` checks work.
if ( typeof globalThis.MessagePort === 'undefined' ) {
	globalThis.MessagePort = class MessagePort {} as unknown as typeof globalThis.MessagePort;
}

// Must be set before the module is required, since the module captures
// `const { videopressAjax } = window` at load time.
// ES `import` is hoisted above assignments, so we use dynamic require().
window.videopressAjax = {
	ajaxUrl: '/wp-admin/admin-ajax.php',
	bridgeUrl: '/bridge.js',
	post_id: 42,
	context: 'test',
} as unknown as typeof window.videopressAjax;

declare const require: ( id: string ) => unknown;

const { tokenBridgeHandler } = require( '../index' ) as {
	tokenBridgeHandler: ( event: MessageEvent ) => Promise< void >;
};

/**
 * Create a synthetic MessageEvent for testing.
 *
 * @param {object}      root0        - Options.
 * @param {object}      root0.data   - Event data payload.
 * @param {string}      root0.origin - Event origin URL.
 * @param {Object|null} root0.source - Event source window mock.
 * @return {MessageEvent} The constructed event.
 */
function createMessageEvent( {
	data = {},
	origin = 'https://videopress.com',
	source = { postMessage: jest.fn() },
}: {
	data?: Record< string, unknown >;
	origin?: string;
	source?: { postMessage: jest.Mock } | null;
} = {} ): MessageEvent {
	const event = new MessageEvent( 'message', {
		data,
		origin,
	} );

	// MessageEvent constructor doesn't allow setting source directly,
	// so we override it via defineProperty.
	Object.defineProperty( event, 'source', { value: source } );

	return event;
}

const validData = {
	event: 'videopress_token_request',
	guid: 'abc123',
	requestId: 'req1',
};

describe( 'tokenBridgeHandler', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	afterEach( () => {
		delete window.__guidsToPlanIds;
	} );

	it( 'ignores messages with wrong event type', async () => {
		const source = { postMessage: jest.fn() };
		const event = createMessageEvent( {
			data: { event: 'unrelated_event' },
			source,
		} );

		await tokenBridgeHandler( event );

		expect( source.postMessage ).not.toHaveBeenCalled();
		expect( mockGetMediaToken ).not.toHaveBeenCalled();
	} );

	it( 'rejects messages from disallowed origins', async () => {
		const source = { postMessage: jest.fn() };
		const event = createMessageEvent( {
			data: validData,
			origin: 'https://evil.com',
			source,
		} );

		await tokenBridgeHandler( event );

		expect( source.postMessage ).not.toHaveBeenCalled();
		expect( mockGetMediaToken ).not.toHaveBeenCalled();
	} );

	it( 'rejects messages missing guid', async () => {
		const source = { postMessage: jest.fn() };
		const event = createMessageEvent( {
			data: { event: 'videopress_token_request', requestId: 'req1' },
			source,
		} );

		await tokenBridgeHandler( event );

		expect( source.postMessage ).not.toHaveBeenCalled();
	} );

	it( 'rejects messages missing requestId', async () => {
		const source = { postMessage: jest.fn() };
		const event = createMessageEvent( {
			data: { event: 'videopress_token_request', guid: 'abc123' },
			source,
		} );

		await tokenBridgeHandler( event );

		expect( source.postMessage ).not.toHaveBeenCalled();
	} );

	it( 'accepts messages from video.wordpress.com', async () => {
		mockGetMediaToken.mockResolvedValue( { token: 'jwt-token' } );
		const source = { postMessage: jest.fn() };
		const origin = 'https://video.wordpress.com';
		const event = createMessageEvent( {
			data: validData,
			origin,
			source,
		} );

		await tokenBridgeHandler( event );

		// Ack + token delivery = 2 calls.
		expect( source.postMessage ).toHaveBeenCalledTimes( 2 );
		expect( source.postMessage.mock.calls[ 1 ][ 0 ] ).toMatchObject( {
			event: 'videopress_token_received',
			jwt: 'jwt-token',
		} );
		expect( source.postMessage.mock.calls[ 1 ][ 1 ] ).toEqual( { targetOrigin: origin } );
	} );

	it( 'sends ack with validated origin, not wildcard', async () => {
		mockGetMediaToken.mockResolvedValue( { token: 'jwt-token' } );
		const source = { postMessage: jest.fn() };
		const origin = 'https://videopress.com';
		const event = createMessageEvent( {
			data: validData,
			origin,
			source,
		} );

		await tokenBridgeHandler( event );

		// First call is the ack.
		const ackCall = source.postMessage.mock.calls[ 0 ];
		expect( ackCall[ 0 ] ).toEqual( {
			event: 'videopress_token_request_ack',
			guid: 'abc123',
			requestId: 'req1',
		} );
		expect( ackCall[ 1 ] ).toEqual( { targetOrigin: origin } );
	} );

	it( 'sends JWT with validated origin, not wildcard', async () => {
		mockGetMediaToken.mockResolvedValue( { token: 'jwt-token' } );
		const source = { postMessage: jest.fn() };
		const origin = 'https://videopress.com';
		const event = createMessageEvent( {
			data: validData,
			origin,
			source,
		} );

		await tokenBridgeHandler( event );

		// Second call is the token delivery.
		const tokenCall = source.postMessage.mock.calls[ 1 ];
		expect( tokenCall[ 0 ] ).toMatchObject( {
			event: 'videopress_token_received',
			guid: 'abc123',
			jwt: 'jwt-token',
			requestId: 'req1',
		} );
		expect( tokenCall[ 1 ] ).toEqual( { targetOrigin: origin } );
	} );

	it( 'sends error with validated origin when token fetch fails', async () => {
		mockGetMediaToken.mockResolvedValue( null );
		const source = { postMessage: jest.fn() };
		const origin = 'https://videopress.com';
		const event = createMessageEvent( {
			data: validData,
			origin,
			source,
		} );

		await tokenBridgeHandler( event );

		// Second call is the error.
		const errorCall = source.postMessage.mock.calls[ 1 ];
		expect( errorCall[ 0 ] ).toMatchObject( {
			event: 'videopress_token_error',
			guid: 'abc123',
			requestId: 'req1',
		} );
		expect( errorCall[ 1 ] ).toEqual( { targetOrigin: origin } );
	} );

	it( 'never sends postMessage with wildcard targetOrigin', async () => {
		mockGetMediaToken.mockResolvedValue( { token: 'jwt-token' } );
		const source = { postMessage: jest.fn() };
		const event = createMessageEvent( {
			data: validData,
			source,
		} );

		await tokenBridgeHandler( event );

		for ( const call of source.postMessage.mock.calls ) {
			const targetOriginArg = call[ 1 ];
			// Should not be '*' string or { targetOrigin: '*' } object.
			expect( targetOriginArg ).not.toBe( '*' );
			expect( targetOriginArg?.targetOrigin ).not.toBe( '*' );
		}
	} );

	it( 'passes correct options to getMediaToken with isRetry', async () => {
		mockGetMediaToken.mockResolvedValue( { token: 'jwt-token' } );
		const source = { postMessage: jest.fn() };
		const event = createMessageEvent( {
			data: { ...validData, isRetry: true },
			source,
		} );

		await tokenBridgeHandler( event );

		expect( mockGetMediaToken ).toHaveBeenCalledWith( 'playback', {
			id: 42,
			guid: 'abc123',
			subscriptionPlanId: 0,
			adminAjaxAPI: '/wp-admin/admin-ajax.php',
			flushToken: true,
		} );
	} );

	it( 'does not flush token when isRetry is absent', async () => {
		mockGetMediaToken.mockResolvedValue( { token: 'jwt-token' } );
		const source = { postMessage: jest.fn() };
		const event = createMessageEvent( {
			data: validData,
			source,
		} );

		await tokenBridgeHandler( event );

		expect( mockGetMediaToken ).toHaveBeenCalledWith(
			'playback',
			expect.objectContaining( { flushToken: undefined } )
		);
	} );

	it( 'passes subscriptionPlanId from __guidsToPlanIds when available', async () => {
		window.__guidsToPlanIds = { abc123: 999 };
		mockGetMediaToken.mockResolvedValue( { token: 'jwt-token' } );
		const source = { postMessage: jest.fn() };
		const event = createMessageEvent( {
			data: validData,
			source,
		} );

		await tokenBridgeHandler( event );

		expect( mockGetMediaToken ).toHaveBeenCalledWith(
			'playback',
			expect.objectContaining( { subscriptionPlanId: 999 } )
		);
	} );

	it( 'does not crash when event.source is null', async () => {
		const event = createMessageEvent( {
			data: validData,
			source: null,
		} );

		await tokenBridgeHandler( event );

		expect( mockGetMediaToken ).not.toHaveBeenCalled();
	} );

	it( 'rejects messages whose source is a MessagePort', async () => {
		const port = new MessagePort();
		const event = createMessageEvent( {
			data: validData,
			source: port as unknown as { postMessage: jest.Mock },
		} );

		await tokenBridgeHandler( event );

		expect( mockGetMediaToken ).not.toHaveBeenCalled();
	} );

	it( 'sends error when getMediaToken rejects', async () => {
		mockGetMediaToken.mockRejectedValue( new Error( 'network error' ) );
		const source = { postMessage: jest.fn() };
		const origin = 'https://videopress.com';
		const event = createMessageEvent( {
			data: validData,
			origin,
			source,
		} );

		await tokenBridgeHandler( event );

		// Should send ack, then error (not throw).
		const errorCall = source.postMessage.mock.calls[ 1 ];
		expect( errorCall[ 0 ] ).toMatchObject( {
			event: 'videopress_token_error',
			guid: 'abc123',
			requestId: 'req1',
		} );
		expect( errorCall[ 1 ] ).toEqual( { targetOrigin: origin } );
	} );

	it( 'sends error when token data has no token field', async () => {
		mockGetMediaToken.mockResolvedValue( {} );
		const source = { postMessage: jest.fn() };
		const origin = 'https://videopress.com';
		const event = createMessageEvent( {
			data: validData,
			origin,
			source,
		} );

		await tokenBridgeHandler( event );

		const errorCall = source.postMessage.mock.calls[ 1 ];
		expect( errorCall[ 0 ] ).toMatchObject( {
			event: 'videopress_token_error',
			guid: 'abc123',
			requestId: 'req1',
		} );
	} );
} );
