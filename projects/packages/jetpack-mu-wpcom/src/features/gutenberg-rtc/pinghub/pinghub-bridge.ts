/* PingHubIframeBridge — parent-side bridge to rest-proxy iframe with binary framing */

export interface PingHubBridge {
	connect( path: string ): Promise< void >;
	disconnect( path: string ): Promise< void >;
	send( path: string, data: Uint8Array ): void;
	onMessage( path: string, handler: ( data: Uint8Array ) => void ): void;
	offMessage( path: string, handler: ( data: Uint8Array ) => void ): void;
	onOpen( path: string, handler: () => void ): void;
	onClose( path: string, handler: ( code: number, reason: string ) => void ): void;
}

const IFRAME_SRC_BASE = 'https://public-api.wordpress.com/wp-admin/rest-proxy/';
const PROXY_ORIGIN = 'https://public-api.wordpress.com';

/**
 * Body of a PingHub proxy response (open, close, message, or error).
 */
interface ProxyResponseBody {
	type: 'open' | 'close' | 'message' | 'error';
	code?: number;
	reason?: string;
	text?: string;
	data?: ArrayBuffer | Blob;
}

/**
 * Normalized proxy response we can handle in one place.
 */
interface NormalizedResponse {
	body: ProxyResponseBody;
	code: number;
	callback: string;
}

// --- Binary frame encoding (path + payload for postMessage) ---

/**
 * Encode path and payload into a single ArrayBuffer for postMessage.
 *
 * @param path    - The path to encode.
 * @param payload - The payload to encode.
 * @return The encoded binary frame.
 */
function encodePathFrame( path: string, payload: Uint8Array ): ArrayBuffer {
	const pathBytes = new TextEncoder().encode( path );
	const buf = new ArrayBuffer( 2 + pathBytes.byteLength + payload.byteLength );
	const view = new DataView( buf );
	view.setUint16( 0, pathBytes.byteLength );
	new Uint8Array( buf, 2, pathBytes.byteLength ).set( pathBytes );
	new Uint8Array( buf, 2 + pathBytes.byteLength ).set( payload );
	return buf;
}

/**
 * Decode path and payload from an ArrayBuffer received via postMessage.
 *
 * @param buffer - The encoded frame.
 * @return Decoded path and payload.
 */
function decodePathFrame( buffer: ArrayBuffer ): { path: string; payload: Uint8Array } {
	const view = new DataView( buffer );
	const pathLen = view.getUint16( 0 );
	const path = new TextDecoder().decode( new Uint8Array( buffer, 2, pathLen ) );
	const payload = new Uint8Array( buffer, 2 + pathLen );
	return { path, payload };
}

// --- Proxy message normalization ---
// Proxy sends either: array [ body, code, headers?, callback ] (supports_args) or legacy object with .callback and .body.

/**
 * Parse event.data (string or already an object) into a plain value.
 *
 * @param data - The postMessage data (possibly a JSON string).
 * @return Parsed value or null.
 */
function parseRaw( data: unknown ): unknown {
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
 * Normalize proxy response (array or legacy object) into a single shape.
 *
 * @param raw - The parsed postMessage payload.
 * @return Normalized response or null if not a valid proxy response.
 */
function normalizeProxyResponse( raw: unknown ): NormalizedResponse | null {
	if ( ! raw || typeof raw !== 'object' ) return null;

	// Array format: [ responseBody, code, headers?, callback ] or [ code, responseBody, headers?, callback ]
	if ( Array.isArray( raw ) && raw.length >= 3 ) {
		const callbackRaw = raw[ raw.length - 1 ];
		const callback = callbackRaw != null ? String( callbackRaw ) : '';
		if ( ! callback ) return null;

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
		)
			return null;
		return { body: body as ProxyResponseBody, code, callback };
	}

	// Legacy object: { callback, body: { type, ... }, code? }
	if ( ! Array.isArray( raw ) ) {
		const o = raw as { callback?: string; body?: ProxyResponseBody; code?: number };
		if ( typeof o.callback !== 'string' || ! o.body || typeof o.body !== 'object' ) return null;
		return {
			body: o.body as ProxyResponseBody,
			code: typeof o.code === 'number' ? o.code : 0,
			callback: o.callback,
		};
	}

	return null;
}

// --- Bridge implementation ---

export class PingHubIframeBridge implements PingHubBridge {
	private iframe: HTMLIFrameElement;
	private ready = false;
	private readyResolvers: Array< () => void > = [];
	private openHandlers = new Map< string, Set< () => void > >();
	private closeHandlers = new Map< string, Set< ( code: number, reason: string ) => void > >();
	private messageHandlers = new Map< string, Set< ( data: Uint8Array ) => void > >();
	private callbackSeq = 1;
	private pending: Record< string, ( ( ok: boolean ) => void ) | undefined > = {};
	private callbackToPath = new Map< string, string >();
	private pathToCallback = new Map< string, string >();
	/** Paths that have received 'open' and not yet 'close' or disconnect – one socket per path. */
	private connectedPaths = new Set< string >();
	/** Paths with a connect request in flight; waiters are resolved when we get open or error. */
	private connectingPathWaiters = new Map<
		string,
		Array< { resolve: () => void; reject: ( err: Error ) => void } >
	>();

	constructor() {
		const existing = document.querySelector(
			`iframe[src^="${ IFRAME_SRC_BASE }"]`
		) as HTMLIFrameElement | null;
		this.iframe = existing ?? this.createIframe();
		window.addEventListener( 'message', this.handleMessage );
	}

	private createIframe(): HTMLIFrameElement {
		const iframe = document.createElement( 'iframe' );
		iframe.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;';
		iframe.src = `${ IFRAME_SRC_BASE }?v=2.0#${ window.location.origin }`;
		document.body.appendChild( iframe );
		return iframe;
	}

	private postToProxy( msg: Record< string, unknown > ): void {
		this.iframe.contentWindow?.postMessage( msg, PROXY_ORIGIN );
	}

	private waitReady(): Promise< void > {
		if ( this.ready ) return Promise.resolve();
		return new Promise( resolve => this.readyResolvers.push( resolve ) );
	}

	private handleMessage = ( event: MessageEvent ): void => {
		if ( event.origin !== PROXY_ORIGIN ) return;

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

		// 2) Binary frame (from us to proxy – we don't receive these from proxy for WS; keep for symmetry)
		if ( data instanceof ArrayBuffer ) {
			const { path, payload } = decodePathFrame( data );
			this.messageHandlers.get( path )?.forEach( h => h( payload ) );
			return;
		}

		// 3) Proxy JSON response (array or object)
		const raw = parseRaw( data );
		const response = normalizeProxyResponse( raw );
		if ( response ) this.handleProxyResponse( response );
	};

	private handleProxyResponse( res: NormalizedResponse ): void {
		const { body, code, callback } = res;
		const path = this.callbackToPath.get( callback );
		const resolvePending = this.pending[ callback ];
		if ( resolvePending ) delete this.pending[ callback ];

		// Connect in flight: resolve/reject all waiters for this path (connect() uses waiters, not pending).
		const settleConnectWaiters = ( success: boolean ) => {
			const waiters = path ? this.connectingPathWaiters.get( path ) : undefined;
			if ( waiters ) {
				const err = new Error( 'PingHub connect failed' );
				waiters.forEach( w => ( success ? w.resolve() : w.reject( err ) ) );
				this.connectingPathWaiters.delete( path! );
			}
		};

		switch ( body.type ) {
			case 'open':
				if ( path ) {
					this.connectedPaths.add( path );
					this.openHandlers.get( path )?.forEach( h => h() );
				}
				settleConnectWaiters( true );
				break;
			case 'close':
				if ( path ) {
					this.connectedPaths.delete( path );
					this.closeHandlers.get( path )?.forEach( h => h( body.code ?? 1000, body.reason ?? '' ) );
				}
				if ( resolvePending ) resolvePending( true );
				break;
			case 'message':
				if ( path && body.data ) this.dispatchToHandlers( path, body.data );
				break;
			case 'error':
				// Proxy returns 444 "already subscribed" when we connect the same path twice – treat as success.
				if ( path && ( code === 444 || body.text === 'already subscribed' ) ) {
					this.connectedPaths.add( path );
					this.openHandlers.get( path )?.forEach( h => h() );
					settleConnectWaiters( true );
				} else {
					if ( path ) {
						this.callbackToPath.delete( callback );
						this.pathToCallback.delete( path );
					}
					settleConnectWaiters( false );
				}
				break;
			default:
				if ( resolvePending ) resolvePending( true );
		}
	}

	private dispatchToHandlers( path: string, data: ArrayBuffer | Blob ): void {
		const handlers = this.messageHandlers.get( path );
		if ( ! handlers?.size ) return;

		const run = ( u8: Uint8Array ) => handlers.forEach( h => h( u8 ) );
		if ( data instanceof ArrayBuffer ) {
			run( new Uint8Array( data ) );
		} else if ( data instanceof Blob ) {
			data.arrayBuffer().then( ab => run( new Uint8Array( ab ) ) );
		}
	}

	// --- Public API ---

	onMessage( path: string, handler: ( data: Uint8Array ) => void ): void {
		if ( ! this.messageHandlers.has( path ) ) this.messageHandlers.set( path, new Set() );
		this.messageHandlers.get( path )!.add( handler );
	}
	offMessage( path: string, handler: ( data: Uint8Array ) => void ): void {
		this.messageHandlers.get( path )?.delete( handler );
	}
	onOpen( path: string, handler: () => void ): void {
		if ( ! this.openHandlers.has( path ) ) this.openHandlers.set( path, new Set() );
		this.openHandlers.get( path )!.add( handler );
	}
	onClose( path: string, handler: ( code: number, reason: string ) => void ): void {
		if ( ! this.closeHandlers.has( path ) ) this.closeHandlers.set( path, new Set() );
		this.closeHandlers.get( path )!.add( handler );
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
			binary: true,
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
			this.pending[ discCallback ] = () => resolve();
			this.postToProxy( {
				type: 'pinghub-proxy',
				action: 'disconnect',
				path,
				callback: discCallback,
			} );
		} );
	}

	send( path: string, data: Uint8Array ): void {
		const win = this.iframe.contentWindow;
		if ( ! win ) return;
		const frame = encodePathFrame( path, data );
		win.postMessage( frame, PROXY_ORIGIN, [ frame ] );
	}
}
