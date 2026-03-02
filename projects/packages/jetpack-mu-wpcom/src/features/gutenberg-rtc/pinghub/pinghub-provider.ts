/* createPingHubProvider — Yjs provider over PingHub via PingHubIframeBridge */

import { Awareness } from '@wordpress/sync';
import * as decoding from 'lib0/decoding';
import * as encoding from 'lib0/encoding';
import { ObservableV2 } from 'lib0/observable';
import * as awarenessProtocol from 'y-protocols/awareness';
import * as syncProtocol from 'y-protocols/sync';
import type { PingHubBridge } from './pinghub-bridge';
import type { ProviderCreator, ProviderCreatorResult, ConnectionStatus } from '@wordpress/sync';
import type * as Y from 'yjs';

export type { ProviderCreator } from '@wordpress/sync';

const MSG_SYNC = 0x00;
const MSG_AWARENESS = 0x01;

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
async function makePath( objectType: string, objectId: string | null ): Promise< string > {
	const t = objectType.replaceAll( '/', '-' );
	const id = objectId ?? 'collection';
	const blogId = getBlogId();

	if ( ! blogId ) {
		throw new Error( 'Cannot determine blog ID for RTC path' );
	}

	return `/pinghub/wpcom/rtc/${ blogId }/${ t }-${ id }`;
}

type PingHubEvents = {
	status: ( status: ConnectionStatus ) => void;
};

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

		this.registerListeners();
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

	private async connect(): Promise< void > {
		try {
			await this.bridge.connect( this.path );
		} catch {
			this.emitStatus( { status: 'disconnected' } );
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
		this.bridge.send( this.path, u8 );
	};

	private readonly onWsOpen = (): void => {
		if ( this.destroyed ) {
			return;
		}
		this.connected = true;
		this.emitStatus( { status: 'connected' } );

		const enc = encoding.createEncoder();
		encoding.writeVarUint( enc, MSG_SYNC );
		syncProtocol.writeSyncStep1( enc, this.ydoc );
		this.send( encoding.toUint8Array( enc ) );

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
		const msgType = decoding.readVarUint( dec );

		switch ( msgType ) {
			case MSG_SYNC: {
				const enc = encoding.createEncoder();
				encoding.writeVarUint( enc, MSG_SYNC );
				syncProtocol.readSyncMessage( dec, enc, this.ydoc, 'pinghub-remote' );

				const reply = encoding.toUint8Array( enc );
				if ( reply.length > 1 ) {
					this.send( reply );
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
		if ( origin === 'pinghub-remote' || ! this.connected ) {
			return;
		}

		const enc = encoding.createEncoder();
		encoding.writeVarUint( enc, MSG_SYNC );
		syncProtocol.writeUpdate( enc, update );
		this.send( encoding.toUint8Array( enc ) );
	};

	private readonly onWsClose = async (): Promise< void > => {
		this.connected = false;
		if ( this.destroyed ) {
			return;
		}
		this.emitStatus( { status: 'disconnected' } );
	};

	public override destroy(): void {
		if ( this.destroyed ) {
			return;
		}
		this.destroyed = true;

		awarenessProtocol.removeAwarenessStates(
			this.awareness,
			[ this.ydoc.clientID ],
			'provider-destroy'
		);

		this.awareness.off( 'change', this.onAwarenessChange );
		this.ydoc.off( 'update', this.onDocUpdate );

		void ( async () => {
			await this.bridge.disconnect( this.path );
			this.connected = false;
		} )();

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

		const path = await makePath( objectType, objectId );
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
