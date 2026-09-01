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

/** Null byte used to separate the room tag from the payload. */
const ROOM_TAG_SEPARATOR = 0x00;

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

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

/**
 * Prepend the room name (UTF-8) and a null separator to the payload.
 *
 * @param room - Room name.
 * @param data - Original payload bytes.
 * @return Tagged payload: [roomBytes, 0x00, ...data].
 */
function tagPayload( room: string, data: Uint8Array ): Uint8Array {
	const roomBytes = textEncoder.encode( room );
	const out = new Uint8Array( roomBytes.length + 1 + data.length );
	out.set( roomBytes, 0 );
	out[ roomBytes.length ] = ROOM_TAG_SEPARATOR;
	out.set( data, roomBytes.length + 1 );
	return out;
}

/**
 * Extract the room name and payload from a tagged message.
 *
 * @param data - Tagged payload bytes.
 * @return Room and payload, or null if no separator found.
 */
function untagPayload( data: Uint8Array ): { room: string; payload: Uint8Array } | null {
	const idx = data.indexOf( ROOM_TAG_SEPARATOR );
	if ( idx === -1 ) {
		return null;
	}
	return {
		room: textDecoder.decode( data.subarray( 0, idx ) ),
		payload: data.subarray( idx + 1 ),
	};
}

const JWT_CACHE_TTL_MS = 60 * 1000; // 1 minute
const MAX_JWT_FETCH_FAILURES = 5;
const JWT_BACKOFF_BASE_MS = 1000;
const JWT_BACKOFF_MAX_MS = 30 * 1000;

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
export function pixel( key: string, value: string | number, unit: string ): void {
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

/**
 * Log a PingHub connection lifecycle event to the server for Logstash.
 * Fire-and-forget: errors are silently swallowed.
 *
 * @param event      - Event name: 'connected', 'disconnected', or 'jwt_fetch_error'.
 * @param properties - Event properties (close_code, connection_lifetime_ms, etc.).
 */
export function logConnectionEvent(
	event: string,
	properties: Record< string, unknown > = {}
): void {
	if ( ! window.jetpackRTC?.connectionLogging ) {
		return;
	}
	apiFetch( {
		path: '/wpcom/v2/rtc/connection-log',
		method: 'POST',
		data: {
			event,
			properties: {
				browser: detectBrowser(),
				...properties,
			},
		},
	} ).catch( () => {} );
}

/**
 * PingHub bridge that multiplexes all rooms over a single WebSocket.
 *
 * All rooms share one PingHub channel scoped to the post being edited.
 * Messages are tagged with the room name inside the binary payload so
 * the bridge can demultiplex incoming messages to the correct handlers.
 */
export class PingHubBridge {
	private openHandlers = new Map< string, Set< () => void > >();
	private closeHandlers = new Map< string, Set< ( code: number, reason: string ) => void > >();
	private messageHandlers = new Map< string, Set< ( data: Uint8Array ) => void > >();
	/** The single shared WebSocket connection. */
	private ws: WebSocket | null = null;
	/** State of the shared connection. */
	private wsState: 'idle' | 'connecting' | 'open' = 'idle';
	/** Rooms currently registered on this bridge. */
	private registeredRooms = new Set< string >();
	/** Waiters for the shared WebSocket to open. */
	private connectingWaiters: Array< { resolve: () => void; reject: ( err: Error ) => void } > = [];
	/** Global message ID counter for chunked sends. */
	private chunkMsgId = 0;
	/** Cached JWT for PingHub authentication. */
	private cachedJwt: string | null = null;
	private cachedJwtTimestamp = 0;
	/** Consecutive JWT fetch failure count. */
	private jwtFetchFailures = 0;
	/** Exponential backoff delay for JWT fetch retries. */
	private jwtBackoffDelay = JWT_BACKOFF_BASE_MS;
	/** Timestamp before which JWT fetches are suppressed. */
	private jwtBackoffUntil = 0;
	/** Reassembly buffer: key = room + ':' + msgId, value = { totalChunks, chunks } */
	private chunkBuffers = new Map<
		string,
		{ totalChunks: number; chunks: Map< number, Uint8Array > }
	>();
	/** Timestamp when the shared WebSocket started connecting. */
	private wsConnectStart = 0;

	/**
	 * Build the shared PingHub channel path for this editing session.
	 *
	 * @return Full WebSocket URL for the shared channel.
	 */
	private channelPath(): string {
		const blogId = getBlogId();
		if ( ! blogId ) {
			throw new Error( 'Cannot determine blog ID for PingHub bridge' );
		}
		const postType = window.jetpackRTC?.currentPostType;
		const postId = window.jetpackRTC?.currentPostId;
		if ( ! postType || ! postId ) {
			throw new Error( 'Cannot determine current post for PingHub bridge' );
		}
		return `wss://public-api.wordpress.com/pinghub/wpcom/rtc/${ blogId }/editor/${ postType }/${ postId }`;
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
	 * Each chunk's payload already contains the room tag. The room is extracted from the first
	 * chunk and used as part of the reassembly buffer key.
	 *
	 * @param room               - Room name (extracted from the chunk's tagged payload).
	 * @param parsed             - Parsed chunk header and stripped payload (without room tag).
	 * @param parsed.msgId       - Message identifier shared across all chunks of one message.
	 * @param parsed.totalChunks - Total number of chunks expected.
	 * @param parsed.chunkIndex  - Zero-based index of this chunk.
	 * @param parsed.payload     - Payload bytes for this chunk (room tag already stripped).
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
	 * Reset JWT backoff state so the next fetch attempt is not suppressed.
	 *
	 * Called by the manager when reconnect state is reset (e.g. on tab
	 * visibility change or successful connection).
	 */
	resetJwtState(): void {
		this.jwtFetchFailures = 0;
		this.jwtBackoffDelay = JWT_BACKOFF_BASE_MS;
		this.jwtBackoffUntil = 0;
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
		if ( this.jwtFetchFailures >= MAX_JWT_FETCH_FAILURES ) {
			return null;
		}
		if ( Date.now() < this.jwtBackoffUntil ) {
			return null;
		}
		const start = Date.now();
		let response: { token: string } | undefined;
		try {
			response = await apiFetch< { token: string } >( {
				path: '/wpcom/v2/rtc/pinghub-token',
				method: 'POST',
			} );
		} catch {
			const elapsed = Date.now() - start;
			this.jwtFetchFailures++;
			this.jwtBackoffUntil = Date.now() + this.jwtBackoffDelay;
			this.jwtBackoffDelay = Math.min( this.jwtBackoffDelay * 2, JWT_BACKOFF_MAX_MS );
			logConnectionEvent( 'jwt_fetch_error', {
				duration_ms: elapsed,
				failure_count: this.jwtFetchFailures,
			} );
			return null;
		}
		this.cachedJwt = response?.token ?? null;
		this.cachedJwtTimestamp = Date.now();
		this.resetJwtState();
		return this.cachedJwt;
	}

	/**
	 * Open the shared WebSocket if it isn't already open or connecting.
	 */
	private async openSharedSocket(): Promise< void > {
		if ( this.wsState !== 'idle' ) {
			return;
		}
		this.wsState = 'connecting';

		const jwt = await this.fetchPinghubJwt();
		let wsUrl = this.channelPath();
		if ( jwt ) {
			wsUrl += '?jwt=' + encodeURIComponent( jwt );
		}

		const ws = new WebSocket( wsUrl );
		ws.binaryType = 'arraybuffer';
		this.ws = ws;
		this.wsConnectStart = Date.now();

		ws.addEventListener( 'open', () => {
			const elapsed = Date.now() - this.wsConnectStart;
			this.wsState = 'open';
			pixel( 'pinghub.conn_open', elapsed, 'ms' );
			logConnectionEvent( 'connected', {
				time_to_connect_ms: elapsed,
				active_rooms: this.registeredRooms.size,
				channel: `editor/${ window.jetpackRTC?.currentPostType }/${ window.jetpackRTC?.currentPostId }`,
			} );
			this.connectingWaiters.splice( 0 ).forEach( ( { resolve } ) => resolve() );
			for ( const room of this.registeredRooms ) {
				this.openHandlers.get( room )?.forEach( h => h() );
			}
		} );

		ws.addEventListener( 'close', event => {
			const elapsed = Date.now() - this.wsConnectStart;
			pixel( 'pinghub.conn_close_code.' + event.code, elapsed, 'ms' );
			logConnectionEvent( 'disconnected', {
				close_code: event.code,
				close_reason: event.reason,
				was_clean: event.wasClean,
				connection_lifetime_ms: elapsed,
				active_rooms: this.registeredRooms.size,
				jwt_age_ms: this.cachedJwtTimestamp > 0 ? Date.now() - this.cachedJwtTimestamp : -1,
			} );
			const wasConnecting = this.wsState === 'connecting';
			this.ws = null;
			this.wsState = 'idle';
			if ( wasConnecting ) {
				const err = new Error( 'PingHub connect failed' );
				this.connectingWaiters.splice( 0 ).forEach( ( { reject } ) => reject( err ) );
			}
			for ( const room of this.registeredRooms ) {
				this.closeHandlers.get( room )?.forEach( h => h( event.code, event.reason ) );
			}
		} );

		ws.addEventListener( 'error', () => {
			pixel( 'pinghub.conn_err', Date.now() - this.wsConnectStart, 'ms' );
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
				// Each chunk's payload is room-tagged. Extract the room,
				// strip the tag, and reassemble with clean payloads.
				const tagged = untagPayload( parsed.payload );
				if ( ! tagged || ! this.registeredRooms.has( tagged.room ) ) {
					return;
				}
				this.reassembleChunk( tagged.room, {
					msgId: parsed.msgId,
					totalChunks: parsed.totalChunks,
					chunkIndex: parsed.chunkIndex,
					payload: tagged.payload,
				} );
			} else {
				const tagged = untagPayload( u8 );
				if ( ! tagged || ! this.registeredRooms.has( tagged.room ) ) {
					return;
				}
				this.messageHandlers.get( tagged.room )?.forEach( h => h( tagged.payload ) );
			}
		} );
	}

	/**
	 * Register a room on the shared WebSocket connection.
	 *
	 * If the WebSocket is already open, the room's open handlers fire
	 * immediately. If it is not yet open, it is opened (or the room
	 * waits for the in-flight connection to complete).
	 *
	 * @param room - Room name.
	 * @return Promise that resolves when the connection is open.
	 */
	async connect( room: string ): Promise< void > {
		this.registeredRooms.add( room );

		if ( this.wsState === 'open' ) {
			this.openHandlers.get( room )?.forEach( h => h() );
			return;
		}

		const promise = new Promise< void >( ( resolve, reject ) => {
			this.connectingWaiters.push( { resolve, reject } );
		} );

		this.openSharedSocket();

		return promise;
	}

	/**
	 * Unregister a room. If no rooms remain, close the shared WebSocket.
	 *
	 * @param room - Room name.
	 */
	async disconnect( room: string ): Promise< void > {
		this.registeredRooms.delete( room );

		// Clean up chunk buffers for this room.
		for ( const key of this.chunkBuffers.keys() ) {
			if ( key.startsWith( room + ':' ) ) {
				this.chunkBuffers.delete( key );
			}
		}

		if ( this.registeredRooms.size === 0 && this.ws ) {
			if ( this.ws.readyState !== WebSocket.CLOSED && this.ws.readyState !== WebSocket.CLOSING ) {
				this.ws.close( 1000, 'disconnect' );
			}
			this.ws = null;
			this.wsState = 'idle';
		}
	}

	/**
	 * Send binary data to peers in the given room.
	 *
	 * Small messages are sent as a single room-tagged frame. Larger messages
	 * are split into chunks, with each chunk individually room-tagged so the
	 * receiver can demultiplex every chunk independently before reassembly.
	 *
	 * @param room - Room name.
	 * @param data - Payload to send.
	 */
	send( room: string, data: Uint8Array ): void {
		if ( ! this.ws || this.ws.readyState !== WebSocket.OPEN ) {
			return;
		}

		const tagged = tagPayload( room, data );
		const sendOne = ( payload: Uint8Array ) => this.ws!.send( uint8ArrayToBase64( payload ) );

		if ( tagged.length <= MAX_PAYLOAD_BEFORE_CHUNK ) {
			sendOne( tagged );
			return;
		}

		// Each chunk is demultiplexed independently on receive by reading its
		// room tag, so every chunk must carry one. Chunk the RAW payload and
		// re-tag each slice as room\0<slice>; tagging once and slicing the
		// tagged buffer would leave later chunks without a room prefix, so the
		// receiver would drop them and the message would never reassemble.
		const roomTagLength = textEncoder.encode( room ).length + 1; // room bytes + separator
		const chunkSize = MAX_PAYLOAD_BEFORE_CHUNK - CHUNK_HEADER_LEN - roomTagLength;
		// eslint-disable-next-line no-bitwise
		const msgId = this.chunkMsgId & 0xffff;
		this.chunkMsgId++;
		const totalChunks = Math.ceil( data.length / chunkSize );
		for ( let i = 0; i < totalChunks; i++ ) {
			const start = i * chunkSize;
			const slice = data.subarray( start, Math.min( start + chunkSize, data.length ) );
			sendOne( buildChunk( msgId, totalChunks, i, tagPayload( room, slice ) ) );
		}
	}
}
