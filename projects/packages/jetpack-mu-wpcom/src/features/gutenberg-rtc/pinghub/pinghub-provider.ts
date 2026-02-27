/* createPingHubProvider — Yjs provider over PingHub via PingHubIframeBridge */

import { Awareness } from '@wordpress/sync';
import * as decoding from 'lib0/decoding';
import * as encoding from 'lib0/encoding';
import * as awarenessProtocol from 'y-protocols/awareness';
import * as syncProtocol from 'y-protocols/sync';
import type { PingHubBridge } from './pinghub-bridge';
import type {
	ProviderCreator,
	ProviderCreatorResult,
	ConnectionStatus,
	ProviderOn,
} from '@wordpress/sync';

export type { ProviderCreator } from '@wordpress/sync';

const MSG_SYNC = 0x00;
const MSG_AWARENESS = 0x01;

/**
 * Sleep for a given number of milliseconds.
 * @param ms - The number of milliseconds to sleep.
 * @return A promise that resolves after the sleep.
 */
function sleep( ms: number ) {
	return new Promise( r => setTimeout( r, ms ) );
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
async function makePath( objectType: string, objectId: string | null ): Promise< string > {
	const t = objectType.replaceAll( '/', '-' );
	const id = objectId ?? 'collection';
	const blogId = getBlogId();

	if ( ! blogId ) {
		throw new Error( 'Cannot determine blog ID for RTC path' );
	}

	return `/pinghub/wpcom/rtc/${ blogId }/${ t }-${ id }`;
}

/**
 * Create a PingHub provider.
 * @param bridge - The PingHub bridge to use.
 * @return A provider creator function.
 */
export function createPingHubProvider( bridge: PingHubBridge ): ProviderCreator {
	return async ( { objectType, objectId, ydoc, awareness } ) => {
		const path = await makePath( objectType, objectId );

		let connected = false;
		let destroyed = false;

		const statusListeners = new Set< ( status: ConnectionStatus ) => void >();

		const emitStatus = ( status: ConnectionStatus ) => {
			statusListeners.forEach( listener => listener( status ) );
		};

		const on: ProviderOn = ( event, callback ) => {
			if ( event === 'status' ) {
				statusListeners.add( callback as ( status: ConnectionStatus ) => void );
			}
		};

		const aw = awareness ?? new Awareness( ydoc );

		const send = ( u8: Uint8Array ) => bridge.send( path, u8 );

		const onWsOpen = () => {
			if ( destroyed ) return;
			connected = true;
			emitStatus( { status: 'connected' } );

			const enc = encoding.createEncoder();
			encoding.writeVarUint( enc, MSG_SYNC );
			syncProtocol.writeSyncStep1( enc, ydoc );
			send( encoding.toUint8Array( enc ) );

			const changed: number[] = Array.from( aw.getStates().keys() );
			if ( changed.length ) broadcastAwareness( changed );
		};

		const onWsMessage = ( data: Uint8Array ) => {
			if ( destroyed ) return;

			const dec = decoding.createDecoder( data );
			const msgType = decoding.readVarUint( dec );

			// eslint-disable-next-line no-console -- Debug logging for PingHub incoming messages.
			console.log( '[PingHub recv]', {
				path,
				msgType,
				bytes: data.length,
			} );

			switch ( msgType ) {
				case MSG_SYNC: {
					const enc = encoding.createEncoder();
					encoding.writeVarUint( enc, MSG_SYNC );
					syncProtocol.readSyncMessage( dec, enc, ydoc, 'pinghub-remote' );

					const reply = encoding.toUint8Array( enc );
					if ( reply.length > 1 ) send( reply );

					return;
				}

				case MSG_AWARENESS: {
					const update = decoding.readVarUint8Array( dec );
					awarenessProtocol.applyAwarenessUpdate( aw, update, 'pinghub-remote' );
					break;
				}

				default:
					break;
			}
		};

		const onAwarenessChange = ( {
			added,
			updated,
			removed,
		}: {
			added: number[];
			updated: number[];
			removed: number[];
		} ) => {
			if ( ! connected ) return;
			broadcastAwareness( added.concat( updated ).concat( removed ) );
		};

		/**
		 * Broadcasts awareness state for the given client IDs over the bridge.
		 *
		 * @param clientIds - Client IDs whose awareness state to broadcast.
		 */
		function broadcastAwareness( clientIds: number[] ) {
			const enc = encoding.createEncoder();
			encoding.writeVarUint( enc, MSG_AWARENESS );
			encoding.writeVarUint8Array( enc, awarenessProtocol.encodeAwarenessUpdate( aw, clientIds ) );
			send( encoding.toUint8Array( enc ) );
		}

		const onDocUpdate = ( update: Uint8Array, origin: unknown ) => {
			if ( origin === 'pinghub-remote' || ! connected ) return;

			const enc = encoding.createEncoder();
			encoding.writeVarUint( enc, MSG_SYNC );
			syncProtocol.writeUpdate( enc, update );
			send( encoding.toUint8Array( enc ) );
		};

		const onClose = async () => {
			connected = false;
			if ( destroyed ) return;
			emitStatus( { status: 'disconnected' } );

			// Exponential backoff: start at 2s, cap at 30s, stop after 5 minutes total.
			let delay = 2000;
			let total = 0;
			const maxTotal = 5 * 60 * 1000;

			while ( ! destroyed && ! connected && total < maxTotal ) {
				await sleep( delay );
				total += delay;
				delay = Math.min( delay * 2, 30000 );

				if ( destroyed ) return;
				try {
					await bridge.connect( path );
					// Resolved: open handler will set connected = true and break the loop.
					break;
				} catch {
					// Connect failed (e.g. proxy error); keep retrying with backoff.
				}
			}
		};

		bridge.onOpen( path, onWsOpen );
		bridge.onClose( path, onClose );
		bridge.onMessage( path, onWsMessage );

		aw.on( 'change', onAwarenessChange );
		ydoc.on( 'updateV2', onDocUpdate );

		emitStatus( { status: 'connecting' } );
		await bridge.connect( path );

		const destroy: ProviderCreatorResult[ 'destroy' ] = () => {
			destroyed = true;

			awarenessProtocol.removeAwarenessStates( aw, [ ydoc.clientID ], 'provider-destroy' );

			aw.off( 'change', onAwarenessChange );
			ydoc.off( 'updateV2', onDocUpdate );

			statusListeners.clear();
			emitStatus( { status: 'disconnected' } );

			void ( async () => {
				await bridge.disconnect( path );
				connected = false;
			} )();
		};

		const result: ProviderCreatorResult = {
			destroy,
			on,
		};

		return result;
	};
}
