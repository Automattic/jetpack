import {
	CHUNK_HEADER_LEN,
	IFRAME_SRC_BASE,
	MAX_PAYLOAD_BEFORE_CHUNK,
	PROXY_ALREADY_SUBSCRIBED,
	PROXY_ORIGIN,
} from './constants';
import {
	base64ToUint8Array,
	buildChunk,
	getOrCreateSet,
	normalizeProxyResponse,
	parseChunkHeader,
	parseRaw,
	textToBytes,
	uint8ArrayToBase64,
} from './utils';
import type { NormalizedProxyResponse, PingHubBridge } from './types';

export class PingHubIframeBridge implements PingHubBridge {
	private iframe: HTMLIFrameElement;
	private ready = false;
	private readyResolvers: Array< () => void > = [];
	private openHandlers = new Map< string, Set< () => void > >();
	private closeHandlers = new Map< string, Set< ( code: number, reason: string ) => void > >();
	private messageHandlers = new Map< string, Set< ( data: Uint8Array ) => void > >();
	private callbackSeq = 1;
	private pending = new Map< string, () => void >();
	private callbackToPath = new Map< string, string >();
	private pathToCallback = new Map< string, string >();
	/** Paths that have received 'open' and not yet 'close' or disconnect – one socket per path. */
	private connectedPaths = new Set< string >();
	/** Paths with a connect request in flight; waiters are resolved when we get open or error. */
	private connectingPathWaiters = new Map<
		string,
		Array< { resolve: () => void; reject: ( err: Error ) => void } >
	>();
	/** Per-path message id for chunked sends. */
	private chunkMsgIdByPath = new Map< string, number >();
	/** Reassembly buffer: key = path + ':' + msgId, value = { totalChunks, chunks } */
	private chunkBuffers = new Map<
		string,
		{ totalChunks: number; chunks: Map< number, Uint8Array > }
	>();

	/** Reuse an existing proxy iframe or create a new one and start listening for messages. */
	constructor() {
		const existing = document.querySelector(
			`iframe[src^="${ IFRAME_SRC_BASE }"]`
		) as HTMLIFrameElement | null;
		this.iframe = existing ?? this.createIframe();
		window.addEventListener( 'message', this.handleMessage );
	}

	/**
	 * Create and append a hidden proxy iframe to the document body.
	 *
	 * @return The created iframe element.
	 */
	private createIframe(): HTMLIFrameElement {
		const iframe = document.createElement( 'iframe' );
		iframe.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;';
		iframe.src = `${ IFRAME_SRC_BASE }?v=2.0#${ window.location.origin }`;
		document.body.appendChild( iframe );
		return iframe;
	}

	/**
	 * Post a structured message to the proxy iframe.
	 *
	 * @param msg - The message to send.
	 */
	private postToProxy( msg: Record< string, unknown > ): void {
		this.iframe.contentWindow?.postMessage( msg, PROXY_ORIGIN );
	}

	/**
	 * Return a promise that resolves once the proxy iframe signals readiness.
	 *
	 * @return Resolves when the proxy is ready.
	 */
	private waitReady(): Promise< void > {
		if ( this.ready ) {
			return Promise.resolve();
		}
		return new Promise( resolve => this.readyResolvers.push( resolve ) );
	}

	/**
	 * Handle incoming postMessage events from the proxy iframe.
	 *
	 * @param event - The MessageEvent from the proxy.
	 */
	private handleMessage = ( event: MessageEvent ): void => {
		if ( event.origin !== PROXY_ORIGIN ) {
			return;
		}

		const data = event.data;

		// 1) Ready / cookie-auth
		if (
			data === 'ready' ||
			( data?.type === 'pinghub-proxy' && data?.body?.type === 'cookie-auth' )
		) {
			this.ready = true;
			this.readyResolvers.splice( 0 ).forEach( r => r() );
			return;
		}

		// 2) Proxy JSON response (array or object)
		const raw = parseRaw( data );
		const response = normalizeProxyResponse( raw );
		if ( response ) {
			this.handleProxyResponse( response );
		}
	};

	/**
	 * Resolve or reject all connect waiters for a path.
	 *
	 * @param path    - The PingHub path.
	 * @param success - Whether the connect succeeded.
	 */
	private settleConnectWaiters( path: string | undefined, success: boolean ): void {
		const waiters = path ? this.connectingPathWaiters.get( path ) : undefined;
		if ( waiters ) {
			const err = new Error( 'PingHub connect failed' );
			waiters.forEach( w => ( success ? w.resolve() : w.reject( err ) ) );
			this.connectingPathWaiters.delete( path! );
		}
	}

	/**
	 * Route a normalized proxy response to the appropriate handler by message type.
	 *
	 * @param res - The normalized proxy response.
	 */
	private handleProxyResponse( res: NormalizedProxyResponse ): void {
		const { body, code, callback } = res;
		const path = this.callbackToPath.get( callback );
		const resolvePending = this.pending.get( callback );
		if ( resolvePending ) {
			this.pending.delete( callback );
		}

		switch ( body.type ) {
			case 'open':
				if ( path ) {
					this.connectedPaths.add( path );
					this.openHandlers.get( path )?.forEach( h => h() );
				}
				this.settleConnectWaiters( path, true );
				break;
			case 'close':
				if ( path ) {
					this.connectedPaths.delete( path );
					this.closeHandlers.get( path )?.forEach( h => h( body.code ?? 1000, body.reason ?? '' ) );
				}
				if ( resolvePending ) {
					resolvePending();
				}
				break;
			case 'message':
				if ( path && body.data !== undefined ) {
					this.dispatchToHandlers( path, body.data );
				}
				break;
			case 'error':
				// Proxy returns 444 "already subscribed" when we connect the same path twice – treat as success.
				if ( path && ( code === PROXY_ALREADY_SUBSCRIBED || body.text === 'already subscribed' ) ) {
					this.connectedPaths.add( path );
					this.openHandlers.get( path )?.forEach( h => h() );
					this.settleConnectWaiters( path, true );
				} else {
					if ( path ) {
						this.callbackToPath.delete( callback );
						this.pathToCallback.delete( path );
					}
					this.settleConnectWaiters( path, false );
				}
				break;
			default:
				if ( resolvePending ) {
					resolvePending();
				}
		}
	}

	/**
	 * Dispatches received data to path handlers.
	 *
	 * Incoming frames may be:
	 * - Base64 string (text frame): decoded to Uint8Array, then treated as chunk or whole message.
	 * - Chunk (first byte CHUNK_MAGIC): buffered by path+msgId; when all chunks received, reassembled in order (chunk 0, 1, …) and passed once to handlers. Non-chunk messages are passed through.
	 *
	 * @param path - PingHub path for the message.
	 * @param data - Raw payload from the proxy.
	 */
	private dispatchToHandlers( path: string, data: ArrayBuffer | Blob | string ): void {
		const handlers = this.messageHandlers.get( path );
		if ( ! handlers?.size ) {
			return;
		}

		const run = ( u8: Uint8Array ) => {
			const parsed = parseChunkHeader( u8 );
			if ( parsed ) {
				this.reassembleChunk( path, parsed, handlers );
				return;
			}
			handlers.forEach( h => h( u8 ) );
		};
		if ( typeof data === 'string' ) {
			try {
				run( base64ToUint8Array( data ) );
			} catch {
				// Fallback: treat as raw bytes (e.g. proxy sent non-base64 text)
				run( textToBytes( data ) );
			}
		} else if ( data instanceof ArrayBuffer ) {
			run( new Uint8Array( data ) );
		} else if ( data instanceof Blob ) {
			data.arrayBuffer().then( ab => run( new Uint8Array( ab ) ) );
		}
	}

	/**
	 * Buffer incoming chunks and dispatch the reassembled message when all chunks have arrived.
	 *
	 * @param path               - PingHub path for the message.
	 * @param parsed             - Parsed chunk header and payload.
	 * @param parsed.msgId       - Message identifier shared across all chunks of one message.
	 * @param parsed.totalChunks - Total number of chunks expected.
	 * @param parsed.chunkIndex  - Zero-based index of this chunk.
	 * @param parsed.payload     - Payload bytes for this chunk.
	 * @param handlers           - Set of handlers to invoke with the reassembled message.
	 */
	private reassembleChunk(
		path: string,
		parsed: { msgId: number; totalChunks: number; chunkIndex: number; payload: Uint8Array },
		handlers: Set< ( data: Uint8Array ) => void >
	): void {
		const key = `${ path }:${ parsed.msgId }`;
		let buf = this.chunkBuffers.get( key );
		if ( ! buf ) {
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
			parts.push( buf.chunks.get( i )! );
		}
		const totalLen = parts.reduce( ( s, p ) => s + p.length, 0 );
		const reassembled = new Uint8Array( totalLen );
		let offset = 0;
		for ( const p of parts ) {
			reassembled.set( p, offset );
			offset += p.length;
		}
		handlers.forEach( h => h( reassembled ) );
	}

	/**
	 * Register a handler for incoming messages on the given path.
	 *
	 * @param path    - PingHub channel path.
	 * @param handler - Callback invoked with the received bytes.
	 */
	onMessage( path: string, handler: ( data: Uint8Array ) => void ): void {
		getOrCreateSet( this.messageHandlers, path ).add( handler );
	}

	/**
	 * Remove a previously registered message handler.
	 *
	 * @param path    - PingHub channel path.
	 * @param handler - The handler to remove.
	 */
	offMessage( path: string, handler: ( data: Uint8Array ) => void ): void {
		this.messageHandlers.get( path )?.delete( handler );
	}

	/**
	 * Register a handler called when a connection opens for the given path.
	 *
	 * @param path    - PingHub channel path.
	 * @param handler - Callback invoked on open.
	 */
	onOpen( path: string, handler: () => void ): void {
		getOrCreateSet( this.openHandlers, path ).add( handler );
	}

	/**
	 * Remove a previously registered open handler.
	 *
	 * @param path    - PingHub channel path.
	 * @param handler - The handler to remove.
	 */
	offOpen( path: string, handler: () => void ): void {
		this.openHandlers.get( path )?.delete( handler );
	}

	/**
	 * Register a handler called when a connection closes for the given path.
	 *
	 * @param path    - PingHub channel path.
	 * @param handler - Callback invoked with close code and reason.
	 */
	onClose( path: string, handler: ( code: number, reason: string ) => void ): void {
		getOrCreateSet( this.closeHandlers, path ).add( handler );
	}

	/**
	 * Remove a previously registered close handler.
	 *
	 * @param path    - PingHub channel path.
	 * @param handler - The handler to remove.
	 */
	offClose( path: string, handler: ( code: number, reason: string ) => void ): void {
		this.closeHandlers.get( path )?.delete( handler );
	}

	async connect( path: string ): Promise< void > {
		await this.waitReady();

		// Already connected: no new socket, just notify so handlers run.
		if ( this.connectedPaths.has( path ) ) {
			this.openHandlers.get( path )?.forEach( h => h() );
			return;
		}

		// Connect already in flight for this path: wait for it instead of sending another.
		const existing = this.connectingPathWaiters.get( path );
		if ( existing ) {
			return new Promise( ( resolve, reject ) => existing.push( { resolve, reject } ) );
		}

		const waiters: Array< { resolve: () => void; reject: ( err: Error ) => void } > = [];
		this.connectingPathWaiters.set( path, waiters );

		const callback = String( this.callbackSeq++ );
		this.callbackToPath.set( callback, path );
		this.pathToCallback.set( path, callback );

		this.postToProxy( {
			type: 'pinghub-proxy',
			action: 'connect',
			path,
			callback,
			supports_args: true,
			binary: false,
		} );

		return new Promise( ( resolve, reject ) => {
			waiters.push( { resolve, reject } );
		} );
	}

	async disconnect( path: string ): Promise< void > {
		await this.waitReady();
		this.connectedPaths.delete( path );
		const callback = this.pathToCallback.get( path );
		if ( callback ) {
			this.callbackToPath.delete( callback );
			this.pathToCallback.delete( path );
		}
		return new Promise( resolve => {
			const discCallback = String( this.callbackSeq++ );
			this.pending.set( discCallback, () => resolve() );
			this.postToProxy( {
				type: 'pinghub-proxy',
				action: 'disconnect',
				path,
				callback: discCallback,
			} );
		} );
	}

	send( path: string, data: Uint8Array ): void {
		if ( ! this.iframe.contentWindow ) {
			return;
		}

		const sendOne = ( payload: Uint8Array ) => {
			this.postToProxy( {
				type: 'pinghub-proxy',
				action: 'send',
				path,
				message: uint8ArrayToBase64( payload ),
			} );
		};

		if ( data.length <= MAX_PAYLOAD_BEFORE_CHUNK ) {
			sendOne( data );
			return;
		}

		const msgId = ( this.chunkMsgIdByPath.get( path ) ?? 0 ) & 0xffff; // eslint-disable-line no-bitwise
		this.chunkMsgIdByPath.set( path, msgId + 1 );
		const chunkSize = MAX_PAYLOAD_BEFORE_CHUNK - CHUNK_HEADER_LEN;
		const totalChunks = Math.ceil( data.length / chunkSize );
		for ( let i = 0; i < totalChunks; i++ ) {
			const start = i * chunkSize;
			const payload = data.subarray( start, Math.min( start + chunkSize, data.length ) );
			const chunk = buildChunk( msgId, totalChunks, i, payload );
			sendOne( chunk );
		}
	}
}
