import * as decoding from 'lib0/decoding';
import * as encoding from 'lib0/encoding';
import * as awarenessProtocol from 'y-protocols/awareness';
import * as syncProtocol from 'y-protocols/sync';
import { PingHubBridge, logConnectionEvent } from './pinghub-bridge';
import type { Awareness, ConnectionStatus } from '@wordpress/sync';
import type * as Y from 'yjs';

const MSG_SYNC = 0x00;
const MSG_AWARENESS = 0x01;
const RECONNECT_BASE_DELAY_MS = 1000;
const RECONNECT_MAX_DELAY_MS = 30 * 1000;
const MAX_RECONNECT_ATTEMPTS = 5;
const STABLE_CONNECTION_MS = 30 * 1000;
const PINGHUB_MANAGER_ORIGIN = 'pinghub-manager';

interface RegisterRoomOptions {
	room: string;
	doc: Y.Doc;
	awareness: Awareness;
	onStatusChange: ( status: ConnectionStatus ) => void;
	onSync: () => void;
}

const rooms: Map< string, PingHubConnection > = new Map();
let bridge: PingHubBridge | null = null;
let isUnloadPending = false;
let areListenersRegistered = false;
let keepaliveWorker: Worker | null = null;

/**
 * Manages a single room's real-time synchronization via PingHub.
 *
 * Handles Yjs sync protocol, awareness broadcasting, and reconnection with
 * exponential backoff. Delegates transport to the shared PingHubBridge.
 */
class PingHubConnection {
	private readonly room: string;
	private readonly clientId: number;
	private readonly doc: Y.Doc;
	private readonly awareness: Awareness;
	private readonly onStatusChange: ( status: ConnectionStatus ) => void;
	private readonly onSync: () => void;

	public connected = false;
	private syncStep1RepliedTo = new Set< number >();
	public reconnectTimer: ReturnType< typeof setTimeout > | null = null;
	public reconnectDelay = RECONNECT_BASE_DELAY_MS;
	public reconnectAttempts = 0;
	private stableConnectionTimer: ReturnType< typeof setTimeout > | null = null;

	public constructor( options: RegisterRoomOptions ) {
		this.room = options.room;
		this.doc = options.doc;
		this.clientId = options.doc.clientID;
		this.awareness = options.awareness;
		this.onStatusChange = options.onStatusChange;
		this.onSync = options.onSync;

		this.doc.on( 'update', this.handleDocUpdate );
		this.awareness.on( 'change', this.handleAwarenessChange );
		if ( bridge ) {
			bridge.on( this.room, 'open', this.handleWsOpen );
			bridge.on( this.room, 'close', this.handleWsClose );
			bridge.on( this.room, 'message', this.handleWsMessage );
		}
	}

	/**
	 * Tear down the connection: remove listeners, cancel reconnection, disconnect.
	 */
	public destroy(): void {
		if ( this.connected ) {
			this.removeAwareness( 'provider-destroy' );
		}

		if ( this.stableConnectionTimer !== null ) {
			clearTimeout( this.stableConnectionTimer );
			this.stableConnectionTimer = null;
		}

		if ( this.reconnectTimer !== null ) {
			clearTimeout( this.reconnectTimer );
			this.reconnectTimer = null;
		}

		this.doc.off( 'update', this.handleDocUpdate );
		this.awareness.off( 'change', this.handleAwarenessChange );
		if ( bridge ) {
			bridge.off( this.room, 'open', this.handleWsOpen );
			bridge.off( this.room, 'close', this.handleWsClose );
			bridge.off( this.room, 'message', this.handleWsMessage );
			bridge.disconnect( this.room );
		}
	}

	/**
	 * Connect the room to PingHub via the shared bridge.
	 */
	public connect(): void {
		if ( ! bridge ) {
			return;
		}
		this.onStatusChange( { status: 'connecting' } );
		bridge.connect( this.room ).catch( () => {
			this.onStatusChange( { status: 'disconnected' } );
			this.scheduleReconnect();
		} );
	}

	/**
	 * Broadcast awareness removal to peers.
	 *
	 * @param reason - Reason for removal (e.g. 'page-hide', 'provider-destroy').
	 */
	public removeAwareness( reason: string ): void {
		awarenessProtocol.removeAwarenessStates( this.awareness, [ this.clientId ], reason );
	}

	/**
	 * Re-broadcast local awareness state to peers.
	 *
	 * Called periodically by the keepalive worker to prevent the y-protocols
	 * awareness timeout (30s) from removing this client on remote peers.
	 */
	public broadcastLocalAwareness(): void {
		if ( ! this.connected ) {
			return;
		}
		const localState = this.awareness.getLocalState();
		if ( localState ) {
			// setLocalState updates the clock and lastUpdated in meta, but
			// does NOT emit 'change' when the state is deep-equal to the
			// previous one. We call it to bump the meta, then manually
			// encode and broadcast so the update reaches remote peers.
			this.awareness.setLocalState( localState );
			const update = awarenessProtocol.encodeAwarenessUpdate( this.awareness, [ this.clientId ] );
			this.broadcastAwareness( update );
		}
	}

	/**
	 * Send a message, prepending the client ID.
	 *
	 * @param u8 - Encoded message payload.
	 */
	private send( u8: Uint8Array ): void {
		if ( ! bridge ) {
			return;
		}
		const enc = encoding.createEncoder();
		encoding.writeVarUint( enc, this.clientId );
		encoding.writeUint8Array( enc, u8 );
		bridge.send( this.room, encoding.toUint8Array( enc ) );
	}

	/**
	 * Send a Yjs sync step 1 message to initiate document synchronization.
	 */
	private sendSyncStep1(): void {
		const enc = encoding.createEncoder();
		encoding.writeVarUint( enc, MSG_SYNC );
		syncProtocol.writeSyncStep1( enc, this.doc );
		this.send( encoding.toUint8Array( enc ) );
	}

	/**
	 * Broadcast an awareness update to all peers.
	 *
	 * @param awarenessUpdate - Encoded awareness update.
	 */
	private broadcastAwareness( awarenessUpdate: Uint8Array ): void {
		const enc = encoding.createEncoder();
		encoding.writeVarUint( enc, MSG_AWARENESS );
		encoding.writeVarUint8Array( enc, awarenessUpdate );
		this.send( encoding.toUint8Array( enc ) );
	}

	/**
	 * Schedule a reconnection attempt with exponential backoff.
	 */
	private scheduleReconnect(): void {
		if ( this.reconnectTimer !== null ) {
			return;
		}
		if ( this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS ) {
			this.onStatusChange( { status: 'disconnected' } );
			return;
		}
		this.reconnectAttempts++;
		logConnectionEvent( 'reconnecting', {
			attempt: this.reconnectAttempts,
			delay_ms: this.reconnectDelay,
		} );
		this.reconnectTimer = setTimeout( () => {
			this.reconnectTimer = null;
			if ( rooms.has( this.room ) ) {
				this.connect();
			}
		}, this.reconnectDelay );
		this.reconnectDelay = Math.min( this.reconnectDelay * 2, RECONNECT_MAX_DELAY_MS );
	}

	/**
	 * Handle WebSocket open. Sends sync step 1 and local awareness state.
	 */
	private handleWsOpen = (): void => {
		if ( ! rooms.has( this.room ) ) {
			return;
		}
		this.connected = true;
		this.syncStep1RepliedTo.clear();
		this.onStatusChange( { status: 'connected' } );

		// Reset backoff state only after the connection has been stable for
		// a while. If the connection closes immediately (e.g. server rejects
		// after auth), the counters are preserved so MAX_RECONNECT_ATTEMPTS
		// is respected and we don't loop forever.
		if ( this.stableConnectionTimer !== null ) {
			clearTimeout( this.stableConnectionTimer );
		}
		this.stableConnectionTimer = setTimeout( () => {
			this.stableConnectionTimer = null;
			this.reconnectDelay = RECONNECT_BASE_DELAY_MS;
			this.reconnectAttempts = 0;
			bridge?.resetJwtState();
		}, STABLE_CONNECTION_MS );

		this.sendSyncStep1();

		// Only broadcast our own awareness state. Other peers will
		// announce themselves; re-broadcasting their states could
		// resurrect stale entries and cause duplicate peers.
		if ( this.awareness.getLocalState() ) {
			const update = awarenessProtocol.encodeAwarenessUpdate( this.awareness, [ this.clientId ] );
			this.broadcastAwareness( update );
		}
	};

	/**
	 * Handle WebSocket close. Schedules reconnection.
	 */
	private handleWsClose = (): void => {
		this.connected = false;
		if ( this.stableConnectionTimer !== null ) {
			clearTimeout( this.stableConnectionTimer );
			this.stableConnectionTimer = null;
		}
		if ( ! rooms.has( this.room ) ) {
			return;
		}
		if ( ! isUnloadPending ) {
			this.onStatusChange( { status: 'disconnected' } );
		}
		this.scheduleReconnect();
	};

	/**
	 * Handle incoming WebSocket messages. Dispatches sync and awareness messages.
	 *
	 * @param data - Raw message payload.
	 */
	private handleWsMessage = ( data: Uint8Array ): void => {
		if ( ! rooms.has( this.room ) ) {
			return;
		}

		const dec = decoding.createDecoder( data );
		const senderClientID = decoding.readVarUint( dec );

		if ( senderClientID === this.clientId ) {
			return;
		}

		const msgType = decoding.readVarUint( dec );

		switch ( msgType ) {
			case MSG_SYNC: {
				const innerType = dec.arr[ dec.pos ];

				const enc = encoding.createEncoder();
				encoding.writeVarUint( enc, MSG_SYNC );
				syncProtocol.readSyncMessage( dec, enc, this.doc, PINGHUB_MANAGER_ORIGIN );
				this.onSync();

				const reply = encoding.toUint8Array( enc );
				if ( reply.length > 1 ) {
					this.send( reply );
				}

				if (
					innerType === syncProtocol.messageYjsSyncStep1 &&
					! this.syncStep1RepliedTo.has( senderClientID )
				) {
					this.syncStep1RepliedTo.add( senderClientID );
					this.sendSyncStep1();
					// Send our awareness so the new peer sees us immediately.
					const awarenessUpdate = awarenessProtocol.encodeAwarenessUpdate( this.awareness, [
						this.clientId,
					] );
					this.broadcastAwareness( awarenessUpdate );
				}
				return;
			}
			case MSG_AWARENESS: {
				const update = decoding.readVarUint8Array( dec );
				awarenessProtocol.applyAwarenessUpdate( this.awareness, update, PINGHUB_MANAGER_ORIGIN );
				break;
			}
			default:
				break;
		}
	};

	/**
	 * Handle local Yjs document updates. Broadcasts the update to peers.
	 *
	 * @param update - Yjs document update.
	 * @param origin - Origin of the update.
	 */
	private handleDocUpdate = ( update: Uint8Array, origin: unknown ): void => {
		if ( ! rooms.has( this.room ) || origin === PINGHUB_MANAGER_ORIGIN || ! this.connected ) {
			return;
		}

		const enc = encoding.createEncoder();
		encoding.writeVarUint( enc, MSG_SYNC );
		syncProtocol.writeUpdate( enc, update );
		this.send( encoding.toUint8Array( enc ) );
	};

	/**
	 * Handle local awareness changes. Broadcasts the changes to peers.
	 *
	 * @param changes         - Changed client IDs.
	 * @param changes.added   - Newly added client IDs.
	 * @param changes.updated - Updated client IDs.
	 * @param changes.removed - Removed client IDs.
	 */
	private handleAwarenessChange = ( {
		added,
		updated,
		removed,
	}: {
		added: number[];
		updated: number[];
		removed: number[];
	} ): void => {
		if ( ! this.connected ) {
			return;
		}
		const changed = added.concat( updated ).concat( removed );
		const update = awarenessProtocol.encodeAwarenessUpdate( this.awareness, changed );
		this.broadcastAwareness( update );
	};
}

/**
 * URL for the current keepalive worker's Blob, so we can revoke it on teardown.
 */
let keepaliveWorkerUrl: string | null = null;

/**
 * Fallback main-thread interval ID, used when a Web Worker cannot be created.
 * Main-thread timers are throttled in background tabs, but this is better
 * than failing entirely.
 */
let keepaliveFallbackTimer: ReturnType< typeof setInterval > | null = null;

/**
 * Invoke the awareness keepalive for every registered room.
 */
function runKeepaliveTick(): void {
	for ( const [ , connection ] of rooms ) {
		connection.broadcastLocalAwareness();
	}
}

/**
 * Create a Web Worker that sends periodic 'tick' messages for awareness keepalive.
 *
 * The worker script is inlined as a Blob URL instead of loaded from a separate
 * file. Web Workers are subject to same-origin policy: if the JS bundle is loaded
 * from a different origin than the page (e.g. `s0.wp.com` scripts on a
 * `*.wordpress.com` page), constructing a Worker from an external URL throws a
 * SecurityError. Blob URLs are treated as same-origin with the page that created
 * them, sidestepping the issue.
 *
 * @return Worker or null if the worker cannot be created.
 */
function createKeepaliveWorker(): Worker | null {
	try {
		const workerCode = "setInterval(function(){postMessage('tick');},25000);";
		const blob = new Blob( [ workerCode ], { type: 'application/javascript' } );
		keepaliveWorkerUrl = URL.createObjectURL( blob );
		const worker = new Worker( keepaliveWorkerUrl );
		worker.onmessage = runKeepaliveTick;
		return worker;
	} catch {
		// Worker construction can fail if Blob/Worker APIs are unavailable
		// or blocked by CSP. Fall back to a main-thread interval so RTC
		// still works (awareness may be throttled in background tabs).
		if ( keepaliveWorkerUrl ) {
			URL.revokeObjectURL( keepaliveWorkerUrl );
			keepaliveWorkerUrl = null;
		}
		keepaliveFallbackTimer = setInterval( runKeepaliveTick, 25 * 1000 );
		return null;
	}
}

/**
 * Tear down the keepalive worker (or the fallback interval).
 */
function destroyKeepaliveWorker(): void {
	if ( keepaliveWorker ) {
		keepaliveWorker.terminate();
		keepaliveWorker = null;
	}
	if ( keepaliveWorkerUrl ) {
		URL.revokeObjectURL( keepaliveWorkerUrl );
		keepaliveWorkerUrl = null;
	}
	if ( keepaliveFallbackTimer !== null ) {
		clearInterval( keepaliveFallbackTimer );
		keepaliveFallbackTimer = null;
	}
}

/**
 * Suppress disconnect status flash during page navigation.
 */
function handleBeforeUnload(): void {
	isUnloadPending = true;
}

/**
 * Broadcast awareness removal for all connected rooms when the page is hidden.
 */
function handlePageHide(): void {
	for ( const [ , connection ] of rooms ) {
		if ( connection.connected ) {
			connection.removeAwareness( 'page-hide' );
		}
	}
}

/**
 * Reconnect all disconnected rooms when the page becomes visible again.
 */
function handleVisibilityChange(): void {
	if ( document.visibilityState !== 'visible' ) {
		return;
	}
	isUnloadPending = false;
	bridge?.resetJwtState();
	for ( const [ , connection ] of rooms ) {
		if ( connection.connected ) {
			continue;
		}
		if ( connection.reconnectTimer !== null ) {
			clearTimeout( connection.reconnectTimer );
			connection.reconnectTimer = null;
		}
		connection.reconnectDelay = RECONNECT_BASE_DELAY_MS;
		connection.reconnectAttempts = 0;
		connection.connect();
	}
}

/**
 * Register a room for real-time synchronization via PingHub.
 *
 * Creates the shared bridge lazily on first call. Each room gets its own
 * PingHubConnection that handles sync protocol, awareness, and reconnection.
 *
 * @param options                - Registration options.
 * @param options.room           - Room name.
 * @param options.doc            - Yjs document to synchronize.
 * @param options.awareness      - Awareness instance for cursor/presence data.
 * @param options.onStatusChange - Callback for connection status changes.
 * @param options.onSync         - Callback invoked on each sync message.
 */
function registerRoom( options: RegisterRoomOptions ): void {
	if ( rooms.has( options.room ) ) {
		return;
	}

	// Lazy-create bridge on first registration.
	if ( ! bridge ) {
		bridge = new PingHubBridge();
	}

	const connection = new PingHubConnection( options );
	rooms.set( options.room, connection );

	if ( ! areListenersRegistered ) {
		window.addEventListener( 'beforeunload', handleBeforeUnload );
		window.addEventListener( 'pagehide', handlePageHide );
		document.addEventListener( 'visibilitychange', handleVisibilityChange );
		areListenersRegistered = true;
	}

	if ( ! keepaliveWorker && keepaliveFallbackTimer === null ) {
		keepaliveWorker = createKeepaliveWorker();
	}

	connection.connect();
}

/**
 * Unregister a room, removing all listeners and disconnecting from PingHub.
 *
 * @param room - Room name.
 */
function unregisterRoom( room: string ): void {
	const connection = rooms.get( room );
	if ( ! connection ) {
		return;
	}

	connection.destroy();
	rooms.delete( room );

	if ( rooms.size === 0 ) {
		if ( areListenersRegistered ) {
			window.removeEventListener( 'beforeunload', handleBeforeUnload );
			window.removeEventListener( 'pagehide', handlePageHide );
			document.removeEventListener( 'visibilitychange', handleVisibilityChange );
			areListenersRegistered = false;
		}
		destroyKeepaliveWorker();
	}
}

export const pinghubManager = {
	registerRoom,
	unregisterRoom,
};
