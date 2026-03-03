import { Awareness } from '@wordpress/sync';
import * as decoding from 'lib0/decoding';
import * as encoding from 'lib0/encoding';
import { ObservableV2 } from 'lib0/observable';
import * as awarenessProtocol from 'y-protocols/awareness';
import * as syncProtocol from 'y-protocols/sync';
import {
	MSG_AWARENESS,
	MSG_SYNC,
	RECONNECT_BASE_DELAY_MS,
	RECONNECT_MAX_DELAY_MS,
} from './constants';
import type { PingHubBridge, PingHubEvents } from './types';
import type { ProviderCreator, ProviderCreatorResult, ConnectionStatus } from '@wordpress/sync';
import type * as Y from 'yjs';

// ── Module-level lifecycle management ──────────────────────────────────
//
// A registry of active PingHubProvider instances with shared window-event
// handlers, mirroring the pattern used by Gutenberg's HTTP polling manager
// to prevent duplicate awareness entries on page reload.

const activeProviders = new Set< PingHubProvider >();
let windowListenersRegistered = false;

/**
 * Set when `beforeunload` fires. Lets `onWsClose` distinguish a
 * connection drop caused by navigation from a genuine server error,
 * preventing a brief "disconnected" flash before the new page loads.
 *
 * Reset at the start of the next visibility change in case the user
 * cancels the unload (e.g. dismisses a "Leave page?" dialog).
 */
let isUnloadPending = false;

/**
 * Mark that a page unload has been requested so `onWsClose` can suppress
 * the disconnected status flash during navigation.
 */
function handleBeforeUnload(): void {
	isUnloadPending = true;
}

/**
 * Broadcast an awareness removal for every active provider so peers
 * immediately learn this client has left. Fires on `pagehide`, which
 * is the last reliable event before the browser tears down the page.
 */
function handlePageHide(): void {
	for ( const provider of activeProviders ) {
		provider.broadcastAwarenessRemoval();
	}
}

/**
 * When the tab returns to the foreground, reconnect any providers whose
 * WebSocket was dropped while backgrounded and reset the unload flag.
 */
function handleVisibilityChange(): void {
	if ( document.visibilityState !== 'visible' ) {
		return;
	}
	isUnloadPending = false;
	for ( const provider of activeProviders ) {
		provider.reconnectIfDisconnected();
	}
}

/**
 * Register shared window-level event listeners once, when the first
 * PingHubProvider is created.
 */
function addWindowListeners(): void {
	if ( windowListenersRegistered ) {
		return;
	}
	window.addEventListener( 'beforeunload', handleBeforeUnload );
	window.addEventListener( 'pagehide', handlePageHide );
	document.addEventListener( 'visibilitychange', handleVisibilityChange );
	windowListenersRegistered = true;
}

/**
 * Remove shared window-level event listeners once the last
 * PingHubProvider has been destroyed.
 */
function removeWindowListeners(): void {
	if ( ! windowListenersRegistered || activeProviders.size > 0 ) {
		return;
	}
	window.removeEventListener( 'beforeunload', handleBeforeUnload );
	window.removeEventListener( 'pagehide', handlePageHide );
	document.removeEventListener( 'visibilitychange', handleVisibilityChange );
	windowListenersRegistered = false;
}

/**
 * Get the blog ID from the WordPress globals.
 * @return The blog ID or null if it cannot be determined.
 */
function getBlogId(): number | null {
	// Try to get blog ID from WordPress globals
	// @ts-expect-error - _currentSiteId is a WordPress global not declared on Window
	if ( typeof window._currentSiteId === 'number' ) {
		// @ts-expect-error - _currentSiteId is a WordPress global not declared on Window
		return window._currentSiteId;
	}
	// @ts-expect-error - wpcomGutenberg is a WordPress global not declared on Window
	if ( typeof window.wpcomGutenberg?.blogId === 'number' ) {
		// @ts-expect-error - wpcomGutenberg is a WordPress global not declared on Window
		return window.wpcomGutenberg.blogId;
	}
	// @ts-expect-error - WordPress global
	if ( typeof window.currentBlogId === 'number' ) {
		// @ts-expect-error - currentBlogId is a WordPress global not declared on Window
		return window.currentBlogId;
	}
	return null;
}

/**
 * Make a path for the PingHub provider.
 * @param objectType - The type of the object.
 * @param objectId   - The ID of the object.
 * @return The path for the PingHub provider.
 */
function makePath( objectType: string, objectId: string | null ): string {
	const normalizedType = objectType.replaceAll( '/', '-' );
	const id = objectId ?? 'collection';
	const blogId = getBlogId();

	if ( ! blogId ) {
		throw new Error( 'Cannot determine blog ID for RTC path' );
	}

	return `/pinghub/wpcom/rtc/${ blogId }/${ normalizedType }-${ id }`;
}

/**
 * Yjs provider that uses PingHub over the PingHubIframeBridge for real-time
 * synchronization. Mirrors the HttpPollingProvider shape: one logical channel
 * per room/path, status events via ObservableV2, and awareness + doc updates
 * flowing over the same transport.
 */
class PingHubProvider extends ObservableV2< PingHubEvents > {
	private readonly awareness: Awareness;
	private status: ConnectionStatus[ 'status' ] = 'disconnected';
	private connected = false;
	private destroyed = false;
	private readonly ydoc: Y.Doc;
	private readonly bridge: PingHubBridge;
	private readonly path: string;

	private reconnectTimer: ReturnType< typeof setTimeout > | null = null;
	private reconnectDelay = RECONNECT_BASE_DELAY_MS;
	private syncRequestSent = false;

	public constructor( {
		awareness,
		bridge,
		path,
		ydoc,
	}: {
		awareness?: Awareness;
		bridge: PingHubBridge;
		path: string;
		ydoc: Y.Doc;
	} ) {
		super();
		this.bridge = bridge;
		this.path = path;
		this.ydoc = ydoc;
		this.awareness = awareness ?? new Awareness( ydoc );

		activeProviders.add( this );
		addWindowListeners();

		this.registerListeners();
		this.emitStatus( { status: 'connecting' } );
		void this.connect();
	}

	/**
	 * Broadcast an awareness removal (null state) for this client so peers
	 * immediately drop it. Called from the `pagehide` handler; the bridge's
	 * `send()` uses synchronous `postMessage` which survives page teardown.
	 */
	broadcastAwarenessRemoval(): void {
		if ( ! this.connected || this.destroyed ) {
			return;
		}
		awarenessProtocol.removeAwarenessStates( this.awareness, [ this.ydoc.clientID ], 'page-hide' );
	}

	/**
	 * Reconnect immediately if the WebSocket was dropped (e.g. while the
	 * tab was backgrounded). Called from the `visibilitychange` handler.
	 */
	reconnectIfDisconnected(): void {
		if ( this.destroyed || this.connected ) {
			return;
		}
		if ( this.reconnectTimer !== null ) {
			clearTimeout( this.reconnectTimer );
			this.reconnectTimer = null;
		}
		this.reconnectDelay = RECONNECT_BASE_DELAY_MS;
		this.emitStatus( { status: 'connecting' } );
		void this.connect();
	}

	private registerListeners(): void {
		this.awareness.on( 'change', this.onAwarenessChange );
		this.ydoc.on( 'update', this.onDocUpdate );
		this.bridge.onOpen( this.path, this.onWsOpen );
		this.bridge.onClose( this.path, this.onWsClose );
		this.bridge.onMessage( this.path, this.onWsMessage );
	}

	private unregisterBridgeListeners(): void {
		this.bridge.offOpen( this.path, this.onWsOpen );
		this.bridge.offClose( this.path, this.onWsClose );
		this.bridge.offMessage( this.path, this.onWsMessage );
	}

	private async connect(): Promise< void > {
		try {
			await this.bridge.connect( this.path );
		} catch {
			this.emitStatus( { status: 'disconnected' } );
			this.scheduleReconnect();
		}
	}

	/*
	 * Emit connection status, mirroring HttpPollingProvider semantics:
	 * - Avoid duplicate emissions for the same status (unless there is an error).
	 * - Only emit `connecting` when transitioning from `disconnected`.
	 */
	private emitStatus = ( { error, status }: ConnectionStatus ): void => {
		if ( this.status === status && ! error ) {
			return;
		}
		if ( status === 'connecting' && this.status !== 'disconnected' ) {
			return;
		}

		this.status = status;
		this.emit( 'status', [ { error, status } ] );
	};

	private readonly send = ( u8: Uint8Array ): void => {
		const enc = encoding.createEncoder();
		encoding.writeVarUint( enc, this.ydoc.clientID );
		encoding.writeUint8Array( enc, u8 );
		this.bridge.send( this.path, encoding.toUint8Array( enc ) );
	};

	private sendSyncStep1(): void {
		const enc = encoding.createEncoder();
		encoding.writeVarUint( enc, MSG_SYNC );
		syncProtocol.writeSyncStep1( enc, this.ydoc );
		this.send( encoding.toUint8Array( enc ) );
	}

	private readonly onWsOpen = (): void => {
		if ( this.destroyed ) {
			return;
		}
		this.connected = true;
		this.syncRequestSent = false;
		this.reconnectDelay = RECONNECT_BASE_DELAY_MS;
		this.emitStatus( { status: 'connected' } );

		this.sendSyncStep1();

		const changed: number[] = Array.from( this.awareness.getStates().keys() );
		if ( changed.length ) {
			this.broadcastAwareness( changed );
		}
	};

	private readonly onWsMessage = ( data: Uint8Array ): void => {
		if ( this.destroyed ) {
			return;
		}

		const dec = decoding.createDecoder( data );
		const senderClientID = decoding.readVarUint( dec );

		if ( senderClientID === this.ydoc.clientID ) {
			return;
		}

		const msgType = decoding.readVarUint( dec );

		switch ( msgType ) {
			case MSG_SYNC: {
				// Peek at the inner sync message type (single-byte varint for
				// values 0-2) before readSyncMessage advances the decoder.
				const innerType = dec.arr[ dec.pos ];

				const enc = encoding.createEncoder();
				encoding.writeVarUint( enc, MSG_SYNC );
				syncProtocol.readSyncMessage( dec, enc, this.ydoc, 'pinghub-remote' );

				const reply = encoding.toUint8Array( enc );
				if ( reply.length > 1 ) {
					this.send( reply );
				}

				// On a pub/sub channel our initial sync_step1 (sent in
				// onWsOpen) is lost if no peer is subscribed yet. When we
				// see a peer's sync_step1 for the first time, also send
				// ours so they can respond with their sync_step2.
				if ( innerType === syncProtocol.messageYjsSyncStep1 && ! this.syncRequestSent ) {
					this.syncRequestSent = true;
					this.sendSyncStep1();
				}
				return;
			}
			case MSG_AWARENESS: {
				const update = decoding.readVarUint8Array( dec );
				awarenessProtocol.applyAwarenessUpdate( this.awareness, update, 'pinghub-remote' );
				break;
			}
			default:
				break;
		}
	};

	private readonly onAwarenessChange = ( {
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
		this.broadcastAwareness( added.concat( updated ).concat( removed ) );
	};

	private broadcastAwareness( clientIds: number[] ): void {
		const enc = encoding.createEncoder();
		encoding.writeVarUint( enc, MSG_AWARENESS );
		encoding.writeVarUint8Array(
			enc,
			awarenessProtocol.encodeAwarenessUpdate( this.awareness, clientIds )
		);
		this.send( encoding.toUint8Array( enc ) );
	}

	private readonly onDocUpdate = ( update: Uint8Array, origin: unknown ): void => {
		if ( this.destroyed || origin === 'pinghub-remote' || ! this.connected ) {
			return;
		}

		const enc = encoding.createEncoder();
		encoding.writeVarUint( enc, MSG_SYNC );
		syncProtocol.writeUpdate( enc, update );
		this.send( encoding.toUint8Array( enc ) );
	};

	private readonly onWsClose = (): void => {
		this.connected = false;
		if ( this.destroyed ) {
			return;
		}

		// Don't report disconnected status when the connection was dropped
		// due to page unload (e.g. during a refresh) to avoid briefly
		// flashing the disconnect indicator before the new page loads.
		if ( ! isUnloadPending ) {
			this.emitStatus( { status: 'disconnected' } );
		}
		this.scheduleReconnect();
	};

	private scheduleReconnect(): void {
		if ( this.destroyed || this.reconnectTimer !== null ) {
			return;
		}
		this.reconnectTimer = setTimeout( () => {
			this.reconnectTimer = null;
			if ( ! this.destroyed ) {
				this.emitStatus( { status: 'connecting' } );
				void this.connect();
			}
		}, this.reconnectDelay );
		this.reconnectDelay = Math.min( this.reconnectDelay * 2, RECONNECT_MAX_DELAY_MS );
	}

	public override destroy(): void {
		if ( this.destroyed ) {
			return;
		}
		this.destroyed = true;

		activeProviders.delete( this );
		removeWindowListeners();

		if ( this.reconnectTimer !== null ) {
			clearTimeout( this.reconnectTimer );
			this.reconnectTimer = null;
		}

		// Stop sending doc updates first so nothing new is enqueued while we tear down.
		this.ydoc.off( 'update', this.onDocUpdate );

		// Broadcast a final awareness removal so other peers learn we have left.
		// This intentionally fires onAwarenessChange one last time before we
		// unregister the awareness listener below.
		awarenessProtocol.removeAwarenessStates(
			this.awareness,
			[ this.ydoc.clientID ],
			'provider-destroy'
		);

		// Unregister all remaining listeners so no further events can fire.
		this.awareness.off( 'change', this.onAwarenessChange );
		this.unregisterBridgeListeners();

		this.connected = false;
		void this.bridge.disconnect( this.path );

		this.emitStatus( { status: 'disconnected' } );
		super.destroy();
	}
}

/**
 * Create a PingHub-based provider creator function, mirroring the shape of
 * `createHttpPollingProvider` in the Gutenberg repo while using the existing
 * PingHub bridge as the single transport channel.
 *
 * @param bridge - Bridge used to talk to the PingHub rest-proxy iframe.
 * @return Provider creator compatible with the sync manager.
 */
export function createPingHubProvider( bridge: PingHubBridge ): ProviderCreator {
	return async ( { objectType, objectId, ydoc, awareness } ): Promise< ProviderCreatorResult > => {
		// Only use PingHub for individual posts. Other entity types (collections,
		// comments, patterns, etc.) will not open a PingHub channel.
		// Core passes values like "postType/post", "root/comment", "taxonomy/wp_pattern_category", etc.
		if ( objectType !== 'postType/post' || objectId === null ) {
			return {
				destroy: () => {},
				on: () => {},
			};
		}

		const path = makePath( objectType, objectId );
		const provider = new PingHubProvider( {
			awareness,
			bridge,
			path,
			ydoc,
		} );

		return {
			destroy: () => provider.destroy(),
			on: ( event, callback ) => {
				provider.on(
					event as keyof PingHubEvents,
					callback as ( status: ConnectionStatus ) => void
				);
			},
		};
	};
}
