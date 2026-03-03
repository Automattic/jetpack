import { CHUNK_HEADER_LEN, CHUNK_MAGIC } from './constants';
import type { NormalizedProxyResponse, ProxyResponseBody } from './types';

// --- Base64 for text-frame transport ---

/**
 * Encode a Uint8Array into a base64 string for text-frame transport.
 *
 * @param u8 - Bytes to encode.
 * @return Base64-encoded string.
 */
export function uint8ArrayToBase64( u8: Uint8Array ): string {
	let binary = '';
	for ( let i = 0; i < u8.length; i++ ) {
		binary += String.fromCharCode( u8[ i ] );
	}
	return btoa( binary );
}

/**
 * Decode a base64 string back into a Uint8Array.
 *
 * @param base64 - Base64-encoded string.
 * @return Decoded bytes.
 */
export function base64ToUint8Array( base64: string ): Uint8Array {
	const binary = atob( base64 );
	const u8 = new Uint8Array( binary.length );
	for ( let i = 0; i < binary.length; i++ ) {
		u8[ i ] = binary.charCodeAt( i );
	}
	return u8;
}

// --- Chunking helpers ---

/**
 * Build a single chunk buffer: [CHUNK_MAGIC, msgIdHi, msgIdLo, totalChunks, chunkIndex, ...payload].
 *
 * @param msgId       - Message identifier (per path).
 * @param totalChunks - Total chunks for this message.
 * @param chunkIndex  - Zero-based index of this chunk.
 * @param payload     - Slice of the original payload for this chunk.
 * @return Encoded chunk including header and payload.
 */
export function buildChunk(
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
export function parseChunkHeader( data: Uint8Array ): {
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

// --- Text conversion ---

/**
 * Convert a string to bytes by taking the low byte of each char code.
 *
 * @param str - The string to convert.
 * @return Byte array.
 */
export function textToBytes( str: string ): Uint8Array {
	const u8 = new Uint8Array( str.length );
	for ( let i = 0; i < str.length; i++ ) {
		// eslint-disable-next-line no-bitwise
		u8[ i ] = str.charCodeAt( i ) & 0xff;
	}
	return u8;
}

// --- Collection helpers ---

/**
 * Get or create a Set in a Map for the given key.
 *
 * @param map - The map to look up.
 * @param key - The key to find or create a set for.
 * @return The existing or newly created set.
 */
export function getOrCreateSet< T >( map: Map< string, Set< T > >, key: string ): Set< T > {
	let set = map.get( key );
	if ( ! set ) {
		set = new Set();
		map.set( key, set );
	}
	return set;
}

// --- Proxy message normalization ---

/**
 * Parse event.data (string or already an object) into a plain value.
 *
 * @param data - The postMessage data (possibly a JSON string).
 * @return Parsed value or null.
 */
export function parseRaw( data: unknown ): unknown {
	if ( typeof data === 'string' ) {
		try {
			return JSON.parse( data );
		} catch {
			return null;
		}
	}
	return data;
}

/**
 * Try to parse the array format: [ body, code, headers?, callback ] or [ code, body, headers?, callback ].
 *
 * @param raw - The array payload from the proxy.
 * @return Normalized response or null if not a valid array response.
 */
function parseArrayResponse( raw: unknown[] ): NormalizedProxyResponse | null {
	if ( raw.length < 3 ) {
		return null;
	}

	const callbackRaw = raw[ raw.length - 1 ];
	const callback = callbackRaw != null ? String( callbackRaw ) : '';
	if ( ! callback ) {
		return null;
	}

	let code: number;
	let bodyObj: unknown;
	const first = raw[ 0 ];
	const second = raw[ 1 ];
	const firstIsCode =
		typeof first === 'number' ||
		( typeof first === 'string' && first !== '' && ! Number.isNaN( Number( first ) ) );

	// Order A: [ body, code, headers?, callback ]
	if ( typeof first === 'object' && first !== null ) {
		bodyObj = first;
		code = Number( raw[ raw.length - 2 ] );
	}
	// Order B: [ code, body, headers?, callback ] (code may be number or string from JSON)
	else if ( firstIsCode && typeof second === 'object' && second !== null ) {
		bodyObj = second;
		code = Number( first );
	} else {
		return null;
	}

	// Inner body may be at .body or the object itself (e.g. { type: 'open' } or { body: { type, ... } })
	const body =
		( bodyObj as { body?: ProxyResponseBody } ).body ??
		( ( bodyObj as { type?: string } ).type !== undefined ? bodyObj : null );
	if (
		typeof body !== 'object' ||
		! body ||
		typeof ( body as ProxyResponseBody ).type !== 'string'
	) {
		return null;
	}
	return { body: body as ProxyResponseBody, code, callback };
}

/**
 * Try to parse the legacy object format: { callback, body: { type, ... }, code? }.
 *
 * @param raw - The object payload from the proxy.
 * @return Normalized response or null if not a valid legacy response.
 */
function parseLegacyObjectResponse(
	raw: Record< string, unknown >
): NormalizedProxyResponse | null {
	const o = raw as { callback?: string; body?: ProxyResponseBody; code?: number };
	if ( typeof o.callback !== 'string' || ! o.body || typeof o.body !== 'object' ) {
		return null;
	}
	return {
		body: o.body as ProxyResponseBody,
		code: typeof o.code === 'number' ? o.code : 0,
		callback: o.callback,
	};
}

/**
 * Normalize proxy response (array or legacy object) into a single shape.
 *
 * Proxy sends either an array `[ body, code, headers?, callback ]` (supports_args)
 * or a legacy object with `.callback` and `.body`.
 *
 * @param raw - The parsed postMessage payload.
 * @return Normalized response or null if not a valid proxy response.
 */
export function normalizeProxyResponse( raw: unknown ): NormalizedProxyResponse | null {
	if ( ! raw || typeof raw !== 'object' ) {
		return null;
	}

	if ( Array.isArray( raw ) ) {
		return parseArrayResponse( raw );
	}

	return parseLegacyObjectResponse( raw as Record< string, unknown > );
}
