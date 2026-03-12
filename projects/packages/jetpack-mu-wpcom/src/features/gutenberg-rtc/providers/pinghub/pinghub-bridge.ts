import apiFetch from '@wordpress/api-fetch';

type BridgeEventMap = {
	open: () => void;
	close: ( code: number, reason: string ) => void;
	message: ( data: Uint8Array ) => void;
};

const CHUNK_MAGIC = 0xfe;
const CHUNK_HEADER_LEN = 5; // magic(1) + msgId(2) + totalChunks(1) + chunkIndex(1)
const MAX_PAYLOAD_BEFORE_CHUNK = 1024;
const MAX_CHUNK_BUFFERS = 256;

/**
 * Decode a base64 string back into a Uint8Array.
 *
 * @param base64 - Base64-encoded string.
 * @return Decoded bytes.
 */
function base64ToUint8Array( base64: string ): Uint8Array {
	const binary = atob( base64 );
	const u8 = new Uint8Array( binary.length );
	for ( let i = 0; i < binary.length; i++ ) {
		u8[ i ] = binary.charCodeAt( i );
	}
	return u8;
}

/**
 * Build a single chunk buffer: [CHUNK_MAGIC, msgIdHi, msgIdLo, totalChunks, chunkIndex, ...payload].
 *
 * @param msgId       - Message identifier (per room).
 * @param totalChunks - Total chunks for this message.
 * @param chunkIndex  - Zero-based index of this chunk.
 * @param payload     - Slice of the original payload for this chunk.
 * @return Encoded chunk including header and payload.
 */
function buildChunk(
	msgId: number,
	totalChunks: number,
	chunkIndex: number,
	payload: Uint8Array
): Uint8Array {
	const out = new Uint8Array( CHUNK_HEADER_LEN + payload.length );
	out[ 0 ] = CHUNK_MAGIC;
	out[ 1 ] = ( msgId >> 8 ) & 0xff; // eslint-disable-line no-bitwise
	out[ 2 ] = msgId & 0xff; // eslint-disable-line no-bitwise
	out[ 3 ] = totalChunks;
	out[ 4 ] = chunkIndex;
	out.set( payload, CHUNK_HEADER_LEN );
	return out;
}

/**
 * Parse chunk header. Returns null if not a chunk or invalid.
 *
 * @param data - Candidate frame bytes.
 * @return Parsed header and payload, or null if not a chunk.
 */
function parseChunkHeader( data: Uint8Array ): {
	msgId: number;
	totalChunks: number;
	chunkIndex: number;
	payload: Uint8Array;
} | null {
	if ( data.length < CHUNK_HEADER_LEN || data[ 0 ] !== CHUNK_MAGIC ) {
		return null;
	}
	return {
		msgId: data[ 1 ] * 256 + data[ 2 ],
		totalChunks: data[ 3 ],
		chunkIndex: data[ 4 ],
		payload: data.subarray( CHUNK_HEADER_LEN ),
	};
}

/**
 * Encode a Uint8Array as a base64 string.
 *
 * @param u8 - Byte array.
 * @return Base64-encoded string.
 */
function uint8ArrayToBase64( u8: Uint8Array ): string {
	let binary = '';
	for ( let i = 0; i < u8.length; i++ ) {
		binary += String.fromCharCode( u8[ i ] );
	}
	return btoa( binary );
}

/**
 * Convert a string to bytes by taking the low byte of each char code.
 *
 * @param str - The string to convert.
 * @return Byte array.
 */
function textToBytes( str: string ): Uint8Array {
	const u8 = new Uint8Array( str.length );
	for ( let i = 0; i < str.length; i++ ) {
		// eslint-disable-next-line no-bitwise
		u8[ i ] = str.charCodeAt( i ) & 0xff;
	}
	return u8;
}

/**
 * Get the blog ID from the WordPress globals.
 *
 * @return The blog ID or null if it cannot be determined.
 */
function getBlogId(): number | null {
	if ( typeof window._currentSiteId === 'number' ) {
		return window._currentSiteId;
	}
	if ( typeof window.wpcomGutenberg?.blogId === 'number' ) {
		return window.wpcomGutenberg.blogId;
	}
	if ( typeof window.currentBlogId === 'number' ) {
		return window.currentBlogId;
	}
	return null;
}

const JWT_CACHE_TTL_MS = 60 * 1000; // 1 minute

let detectedBrowser: string | null = null;

/**
 * Detect the current browser for analytics tagging.
 *
 * @return Browser name string.
 */
function detectBrowser(): string {
	if ( detectedBrowser ) {
		return detectedBrowser;
	}

	const ua = navigator.userAgent;
	if ( /OPR\//.test( ua ) ) {
		detectedBrowser = 'opera';
	} else if ( /Firefox\//.test( ua ) ) {
		detectedBrowser = 'firefox';
	} else if ( /^((?!chrome|android).)*safari/i.test( ua ) ) {
		detectedBrowser = 'safari';
	} else if ( /Chrome\//.test( ua ) && ! /Edg\//.test( ua ) ) {
		detectedBrowser = 'chrome';
	} else if ( /Edg\//.test( ua ) ) {
		detectedBrowser = 'edge';
	} else {
		detectedBrowser = 'unknown';
	}

	return detectedBrowser;
}

/**
 * Send an analytics pixel event for PingHub connection tracking.
 *
 * @param key   - Dot-delimited metric key.
 * @param value - Metric value.
 * @param unit  - Unit indicator ('ms' for milliseconds, 'c' for counter).
 */
function pixel( key: string, value: string | number, unit: string ): void {
	new Image().src =
		'https://pixel.wp.com/boom.gif?' +
		'v=0.9&u=https://public-api.wordpress.com/pinghub&' +
		'json={"beacons":["' +
		key +
		'.' +
		detectBrowser() +
		':' +
		value +
		'|' +
		unit +
		'"]}';
}

export class PingHubBridge {
	private openHandlers = new Map< string, Set< () => void > >();
	private closeHandlers = new Map< string, Set< ( code: number, reason: string ) => void > >();
	private messageHandlers = new Map< string, Set< ( data: Uint8Array ) => void > >();
	/** Active WebSocket per room. */
	private sockets = new Map< string, WebSocket >();
	/** Waiters for an in-flight connect per room. */
	private connectingWaiters = new Map<
		string,
		Array< { resolve: () => void; reject: ( err: Error ) => void } >
	>();
	/** Per-room message ID for chunked sends. */
	private chunkMsgIdByRoom = new Map< string, number >();
	/** Cached JWT for PingHub authentication. */
	private cachedJwt: string | null = null;
	private cachedJwtTimestamp = 0;
	/** Reassembly buffer: key = room + ':' + msgId, value = { totalChunks, chunks } */
	private chunkBuffers = new Map<
		string,
		{ totalChunks: number; chunks: Map< number, Uint8Array > }
	>();

	/**
	 * Build the full PingHub path for a room name.
	 *
	 * @param room - Short room identifier (e.g. "postType-post-42").
	 * @return Full PingHub channel path.
	 */
	private fullPath( room: string ): string {
		const blogId = getBlogId();
		if ( ! blogId ) {
			throw new Error( 'Cannot determine blog ID for PingHub bridge' );
		}
		return `wss://public-api.wordpress.com/pinghub/wpcom/rtc/${ blogId }/${ room }`;
	}

	/**
	 * Return the handler map for a given event type.
	 *
	 * @param event - The event name.
	 * @return The corresponding handler map.
	 */
	private handlersFor< E extends keyof BridgeEventMap >(
		event: E
	): Map< string, Set< BridgeEventMap[ E ] > > {
		switch ( event ) {
			case 'open':
				return this.openHandlers as Map< string, Set< BridgeEventMap[ E ] > >;
			case 'close':
				return this.closeHandlers as Map< string, Set< BridgeEventMap[ E ] > >;
			case 'message':
				return this.messageHandlers as Map< string, Set< BridgeEventMap[ E ] > >;
			default:
				throw new Error( `Unknown bridge event: ${ String( event ) }` );
		}
	}

	/**
	 * Buffer incoming chunks and dispatch the reassembled message when all chunks have arrived.
	 *
	 * @param room               - Room name.
	 * @param parsed             - Parsed chunk header and payload.
	 * @param parsed.msgId       - Message identifier shared across all chunks of one message.
	 * @param parsed.totalChunks - Total number of chunks expected.
	 * @param parsed.chunkIndex  - Zero-based index of this chunk.
	 * @param parsed.payload     - Payload bytes for this chunk.
	 */
	private reassembleChunk(
		room: string,
		parsed: { msgId: number; totalChunks: number; chunkIndex: number; payload: Uint8Array }
	): void {
		const key = `${ room }:${ parsed.msgId }`;
		let buf = this.chunkBuffers.get( key );
		if ( ! buf ) {
			if ( this.chunkBuffers.size >= MAX_CHUNK_BUFFERS ) {
				const oldest = this.chunkBuffers.keys().next().value;
				if ( oldest !== undefined ) {
					this.chunkBuffers.delete( oldest );
				}
			}
			buf = { totalChunks: parsed.totalChunks, chunks: new Map() };
			this.chunkBuffers.set( key, buf );
		}
		buf.chunks.set( parsed.chunkIndex, parsed.payload );
		if ( buf.chunks.size !== buf.totalChunks ) {
			return;
		}

		this.chunkBuffers.delete( key );
		const parts: Uint8Array[] = [];
		for ( let i = 0; i < buf.totalChunks; i++ ) {
			const chunk = buf.chunks.get( i );
			if ( ! chunk ) {
				return;
			}
			parts.push( chunk );
		}
		const totalLen = parts.reduce( ( s, p ) => s + p.length, 0 );
		const reassembled = new Uint8Array( totalLen );
		let offset = 0;
		for ( const p of parts ) {
			reassembled.set( p, offset );
			offset += p.length;
		}
		this.messageHandlers.get( room )?.forEach( h => h( reassembled ) );
	}

	/**
	 * Register an event handler for a room.
	 *
	 * @param room    - Room name.
	 * @param event   - Event name: 'open', 'close', or 'message'.
	 * @param handler - Callback for the event.
	 */
	on< E extends keyof BridgeEventMap >(
		room: string,
		event: E,
		handler: BridgeEventMap[ E ]
	): void {
		const map = this.handlersFor( event );
		let set = map.get( room );
		if ( ! set ) {
			set = new Set();
			map.set( room, set );
		}
		set.add( handler );
	}

	/**
	 * Remove a previously registered event handler.
	 *
	 * @param room    - Room name.
	 * @param event   - Event name: 'open', 'close', or 'message'.
	 * @param handler - The handler to remove.
	 */
	off< E extends keyof BridgeEventMap >(
		room: string,
		event: E,
		handler: BridgeEventMap[ E ]
	): void {
		this.handlersFor( event ).get( room )?.delete( handler );
	}

	/**
	 * Fetch a short-lived JWT for PingHub authentication via the REST endpoint.
	 * Caches the token for 1 minute to avoid redundant requests on reconnects.
	 *
	 * @return JWT string, or null on failure.
	 */
	private async fetchPinghubJwt(): Promise< string | null > {
		if ( this.cachedJwt && Date.now() - this.cachedJwtTimestamp < JWT_CACHE_TTL_MS ) {
			return this.cachedJwt;
		}
		try {
			const response = await apiFetch< { token: string } >( {
				path: '/wpcom/v2/gutenberg-rtc/pinghub-token',
				method: 'POST',
			} );
			this.cachedJwt = response?.token ?? null;
			this.cachedJwtTimestamp = Date.now();
			return this.cachedJwt;
		} catch {
			return null;
		}
	}

	/**
	 * Open a direct WebSocket connection to PingHub for the given room.
	 *
	 * Fetches a short-lived JWT from the REST endpoint and appends it as
	 * ?jwt=<token> so pinghub-auth.php can authenticate the connection when
	 * WPCOM cookies are absent (third-party cookie blocking on custom-domain
	 * Jetpack/Atomic sites).
	 *
	 * @param room - Room name.
	 * @return Promise
	 */
	async connect( room: string ): Promise< void > {
		// Already open: fire open handlers and return.
		const existing = this.sockets.get( room );
		if ( existing?.readyState === WebSocket.OPEN ) {
			this.openHandlers.get( room )?.forEach( h => h() );
			return Promise.resolve();
		}

		// Connect already in flight: wait for it instead of opening another socket.
		const existingWaiters = this.connectingWaiters.get( room );
		if ( existingWaiters ) {
			return new Promise( ( resolve, reject ) => existingWaiters.push( { resolve, reject } ) );
		}

		const waiters: Array< { resolve: () => void; reject: ( err: Error ) => void } > = [];
		this.connectingWaiters.set( room, waiters );

		// Fetch a short-lived JWT so the connection authenticates even when
		// WPCOM cookies are absent (third-party cookie blocking on
		// custom-domain Jetpack/Atomic sites).
		let wsUrl = this.fullPath( room );
		const jwt = await this.fetchPinghubJwt();
		if ( jwt ) {
			wsUrl += '?jwt=' + encodeURIComponent( jwt );
		}

		const ws = new WebSocket( wsUrl );
		ws.binaryType = 'arraybuffer';
		this.sockets.set( room, ws );

		const start = Date.now();

		ws.addEventListener( 'open', () => {
			pixel( 'pinghub.conn_open', Date.now() - start, 'ms' );
			this.connectingWaiters.delete( room );
			waiters.splice( 0 ).forEach( ( { resolve } ) => resolve() );
			this.openHandlers.get( room )?.forEach( h => h() );
		} );

		ws.addEventListener( 'close', event => {
			pixel( 'pinghub.conn_close_code.' + event.code, Date.now() - start, 'ms' );
			this.sockets.delete( room );
			if ( this.connectingWaiters.has( room ) ) {
				this.connectingWaiters.delete( room );
				const err = new Error( 'PingHub connect failed' );
				waiters.splice( 0 ).forEach( ( { reject } ) => reject( err ) );
			}
			this.closeHandlers.get( room )?.forEach( h => h( event.code, event.reason ) );
		} );

		ws.addEventListener( 'error', () => {
			pixel( 'pinghub.conn_err', Date.now() - start, 'ms' );
		} );

		ws.addEventListener( 'message', event => {
			const { data } = event;
			let u8: Uint8Array;
			if ( data instanceof ArrayBuffer ) {
				u8 = new Uint8Array( data );
			} else if ( typeof data === 'string' ) {
				try {
					u8 = base64ToUint8Array( data );
				} catch {
					u8 = textToBytes( data );
				}
			} else {
				return;
			}
			const parsed = parseChunkHeader( u8 );
			if ( parsed ) {
				this.reassembleChunk( room, parsed );
			} else {
				this.messageHandlers.get( room )?.forEach( h => h( u8 ) );
			}
		} );

		return new Promise( ( resolve, reject ) => {
			waiters.push( { resolve, reject } );
		} );
	}

	/**
	 * Close the WebSocket for the given room.
	 *
	 * @param room - Room name.
	 */
	async disconnect( room: string ): Promise< void > {
		const ws = this.sockets.get( room );
		this.sockets.delete( room );
		this.connectingWaiters.delete( room );
		if ( ws && ws.readyState !== WebSocket.CLOSED && ws.readyState !== WebSocket.CLOSING ) {
			ws.close( 1000, 'disconnect' );
		}
	}

	/**
	 * Send binary data to peers in the given room.
	 *
	 * Messages larger than MAX_PAYLOAD_BEFORE_CHUNK bytes are split into chunks
	 * so all peers (regardless of transport) can reassemble them.
	 *
	 * @param room - Room name.
	 * @param data - Payload to send.
	 */
	send( room: string, data: Uint8Array ): void {
		const ws = this.sockets.get( room );
		if ( ! ws || ws.readyState !== WebSocket.OPEN ) {
			return;
		}

		const sendOne = ( payload: Uint8Array ) => ws.send( uint8ArrayToBase64( payload ) );

		if ( data.length <= MAX_PAYLOAD_BEFORE_CHUNK ) {
			sendOne( data );
			return;
		}

		// eslint-disable-next-line no-bitwise
		const msgId = ( this.chunkMsgIdByRoom.get( room ) ?? 0 ) & 0xffff;
		this.chunkMsgIdByRoom.set( room, msgId + 1 );
		const chunkSize = MAX_PAYLOAD_BEFORE_CHUNK - CHUNK_HEADER_LEN;
		const totalChunks = Math.ceil( data.length / chunkSize );
		for ( let i = 0; i < totalChunks; i++ ) {
			const start = i * chunkSize;
			const payload = data.subarray( start, Math.min( start + chunkSize, data.length ) );
			sendOne( buildChunk( msgId, totalChunks, i, payload ) );
		}
	}
}
