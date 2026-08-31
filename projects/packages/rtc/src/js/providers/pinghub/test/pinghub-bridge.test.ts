/**
 * Tests for the PingHub bridge chunking round-trip.
 *
 * Regression guard for DOTCOM-17708: messages larger than the single-frame
 * threshold must survive the send -> chunk -> receive -> reassemble round-trip.
 * The regression tagged the whole message with the room name once and then
 * chunked the tagged buffer, so only the first chunk carried the room tag and
 * every later chunk was dropped on receive, meaning payloads over ~1024 bytes
 * never reassembled.
 */
import { jest } from '@jest/globals';

jest.unstable_mockModule( '@wordpress/api-fetch', () => ( {
	default: jest.fn( () => Promise.resolve( { token: 'test-jwt' } ) ),
} ) );

const { PingHubBridge } = await import( '../pinghub-bridge' );

// Mirror of the (module-private) wire constants in pinghub-bridge.ts.
const CHUNK_MAGIC = 0xfe;
const MAX_PAYLOAD_BEFORE_CHUNK = 1024;

type FakeEvent = Record< string, unknown >;

/**
 * Minimal WebSocket stand-in (jsdom does not implement WebSocket). Records the
 * frames passed to send() and lets tests fire lifecycle/message events at the
 * listeners the bridge registers.
 */
class MockWebSocket {
	static readonly CONNECTING = 0;
	static readonly OPEN = 1;
	static readonly CLOSING = 2;
	static readonly CLOSED = 3;
	static instances: MockWebSocket[] = [];

	url: string;
	binaryType = 'blob';
	readyState: number = MockWebSocket.CONNECTING;
	sent: string[] = [];
	private listeners: Record< string, Array< ( event: FakeEvent ) => void > > = {};

	/**
	 * Track the created socket so tests can drive it.
	 *
	 * @param url - The socket URL the bridge connected to.
	 */
	constructor( url: string ) {
		this.url = url;
		MockWebSocket.instances.push( this );
	}

	/**
	 * Register a listener for a socket event.
	 *
	 * @param type - Event name.
	 * @param cb   - Listener callback.
	 */
	addEventListener( type: string, cb: ( event: FakeEvent ) => void ): void {
		( this.listeners[ type ] ||= [] ).push( cb );
	}

	/**
	 * Remove a previously registered listener.
	 *
	 * @param type - Event name.
	 * @param cb   - Listener callback to remove.
	 */
	removeEventListener( type: string, cb: ( event: FakeEvent ) => void ): void {
		this.listeners[ type ] = ( this.listeners[ type ] || [] ).filter( fn => fn !== cb );
	}

	/**
	 * Capture a frame the bridge sent.
	 *
	 * @param data - Base64-encoded frame the bridge is sending.
	 */
	send( data: string ): void {
		this.sent.push( data );
	}

	/** Close the socket and notify listeners. */
	close(): void {
		this.readyState = MockWebSocket.CLOSED;
		this.emit( 'close', { code: 1000, reason: 'test', wasClean: true } );
	}

	/**
	 * Dispatch an event to the bridge's registered listeners.
	 *
	 * @param type  - Event name.
	 * @param event - Event payload.
	 */
	emit( type: string, event: FakeEvent = {} ): void {
		( this.listeners[ type ] || [] ).forEach( cb => cb( event ) );
	}

	/** Transition to OPEN and notify the bridge. */
	fireOpen(): void {
		this.readyState = MockWebSocket.OPEN;
		this.emit( 'open', {} );
	}
}

/**
 * Decode a base64 frame back into bytes (mirrors the bridge's wire format).
 *
 * @param base64 - Base64-encoded frame.
 * @return Decoded bytes.
 */
function decodeFrame( base64: string ): Uint8Array {
	const binary = atob( base64 );
	const u8 = new Uint8Array( binary.length );
	for ( let i = 0; i < binary.length; i++ ) {
		u8[ i ] = binary.charCodeAt( i );
	}
	return u8;
}

/**
 * Flush pending microtasks/timers so the async connect can settle.
 *
 * @return A promise that resolves on the next macrotask.
 */
function flush(): Promise< void > {
	return new Promise( resolve => setTimeout( resolve, 0 ) );
}

describe( 'PingHubBridge chunking', () => {
	const room = 'post-42';
	let bridge: InstanceType< typeof PingHubBridge >;

	beforeEach( () => {
		MockWebSocket.instances = [];
		( globalThis as Record< string, unknown > ).WebSocket = MockWebSocket;
		( window as Record< string, unknown > )._currentSiteId = 123;
		( window as Record< string, unknown > ).jetpackRTC = {
			currentPostType: 'post',
			currentPostId: 1,
		};
		bridge = new PingHubBridge();
	} );

	afterEach( () => {
		delete ( globalThis as Record< string, unknown > ).WebSocket;
		delete ( window as Record< string, unknown > )._currentSiteId;
		delete ( window as Record< string, unknown > ).jetpackRTC;
	} );

	/**
	 * Open the shared socket and return the underlying mock once it is OPEN.
	 *
	 * @return The mock WebSocket backing the bridge.
	 */
	async function connect(): Promise< MockWebSocket > {
		const connected = bridge.connect( room );
		await flush();
		const ws = MockWebSocket.instances[ MockWebSocket.instances.length - 1 ];
		ws.fireOpen();
		await connected;
		ws.sent = []; // Drop any handshake frames; capture only the test's sends.
		return ws;
	}

	/**
	 * Echo every frame the bridge sent back into its own message handler, as the
	 * PingHub server would broadcast it to peers in the room.
	 *
	 * @param ws - The mock socket whose sent frames should be echoed back.
	 */
	function echo( ws: MockWebSocket ): void {
		ws.sent.forEach( frame => ws.emit( 'message', { data: frame } ) );
	}

	it( 'round-trips a message larger than the chunk threshold', async () => {
		const ws = await connect();
		const received: Uint8Array[] = [];
		bridge.on( room, 'message', data => {
			received.push( data );
		} );

		// 5000 bytes forces multiple chunks and includes 0x00 bytes, which the
		// pre-fix code mis-parsed as room separators inside untagged chunks.
		const payload = new Uint8Array( 5000 );
		for ( let i = 0; i < payload.length; i++ ) {
			payload[ i ] = i % 256;
		}

		bridge.send( room, payload );
		expect( ws.sent.length ).toBeGreaterThan( 1 ); // Actually chunked.

		echo( ws );

		expect( received ).toHaveLength( 1 );
		expect( Array.from( received[ 0 ] ) ).toEqual( Array.from( payload ) );
	} );

	it( 'tags every chunk and keeps each frame within the single-frame limit', async () => {
		const ws = await connect();
		const payload = new Uint8Array( 5000 ).fill( 65 );
		const roomTag = new TextEncoder().encode( room );

		bridge.send( room, payload );

		expect( ws.sent.length ).toBeGreaterThan( 1 );
		ws.sent.forEach( frame => {
			const bytes = decodeFrame( frame );
			expect( bytes.length ).toBeLessThanOrEqual( MAX_PAYLOAD_BEFORE_CHUNK );
			expect( bytes[ 0 ] ).toBe( CHUNK_MAGIC );
			// After the 5-byte chunk header, every chunk must start with room\0.
			const tagged = bytes.subarray( 5 );
			expect( Array.from( tagged.subarray( 0, roomTag.length ) ) ).toEqual( Array.from( roomTag ) );
			expect( tagged[ roomTag.length ] ).toBe( 0 );
		} );
	} );

	it( 'round-trips a small single-frame message', async () => {
		const ws = await connect();
		const received: Uint8Array[] = [];
		bridge.on( room, 'message', data => {
			received.push( data );
		} );

		const payload = new Uint8Array( [ 1, 2, 3, 4, 5 ] );
		bridge.send( room, payload );

		expect( ws.sent ).toHaveLength( 1 ); // Single frame, not chunked.
		echo( ws );

		expect( received ).toHaveLength( 1 );
		expect( Array.from( received[ 0 ] ) ).toEqual( Array.from( payload ) );
	} );
} );
