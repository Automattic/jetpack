import type { ProviderCreator, ProviderCreatorResult } from '@wordpress/sync';
import type { Awareness } from 'y-protocols/awareness';

/*
 * Module-level state shared across all `withRoomLimit` wrappers.
 *
 * The polling manager in `@wordpress/sync` is a singleton that sends a single
 * HTTP request for every registered room. To fully stop polling when the
 * room limit is reached we must destroy *all* wrapped providers — entity
 * rooms AND collection rooms — in one shot. We only trigger that global
 * teardown when the current client is in the overflow set (newest by joinedAt).
 */
let breached = false;

/**
 * Returns true if the room limit has been breached in this window.
 * Uses a window global so the value is accessible across webpack bundles
 * (the RTC bundle sets it, the notices bundle reads it).
 *
 * @return Whether the room limit has been breached.
 */
export function isRoomLimitBreached(): boolean {
	return ( window as Record< string, unknown > ).__wpcomRtcRoomLimitBreached === true;
}
const teardowns: Array< () => void > = [];

const NOOP_RESULT: ProviderCreatorResult = {
	destroy: () => {},
	on: () => {},
};

/**
 * Wraps a provider creator to enforce a per-room connection limit.
 *
 * When the wrapped provider initializes it stamps a join timestamp into the
 * local awareness state (`__wpcomRtcJoinedAt`). On every awareness change,
 * connections are sorted by that timestamp. When the total number of
 * connections exceeds the allowed maximum, only the current client is
 * considered "overflow" if it is among the newest (by joinedAt). In that
 * case all wrapped providers in this window are destroyed.
 *
 * @param creator         - The provider creator to wrap.
 * @param maxPeersPerRoom - Max connections allowed per room. Undefined or <= 0 disables enforcement.
 * @return Wrapped provider creator.
 */
export function withRoomLimit(
	creator: ProviderCreator,
	maxPeersPerRoom?: number
): ProviderCreator {
	if ( ! maxPeersPerRoom || maxPeersPerRoom <= 0 ) {
		return creator;
	}

	return async ( options ): Promise< ProviderCreatorResult > => {
		if ( breached ) {
			return NOOP_RESULT;
		}

		const { awareness } = options;
		const innerProvider = await creator( options );
		let destroyed = false;
		const statusListeners: Array< ( status: unknown ) => void > = [];

		/** Trigger a global teardown for all wrapped providers in this window. */
		function destroyAll(): void {
			breached = true;
			( window as Record< string, unknown > ).__wpcomRtcRoomLimitBreached = true;

			// Non-admin: record a join request so the admin gets notified.
			const config = window.wpcomRtcNotices;
			if ( config && ! config.isAdmin && config.postId ) {
				const wp = ( window as Record< string, unknown > ).wp as
					| { apiFetch?: ( opts: Record< string, unknown > ) => Promise< unknown > }
					| undefined;
				wp
					?.apiFetch?.( {
						path: '/wpcom/v2/rtc-notices/join-request',
						method: 'POST',
						data: { post_id: config.postId },
					} )
					?.catch?.( () => {} );
			}

			for ( const fn of teardowns ) {
				fn();
			}
			teardowns.length = 0;
		}

		/**
		 * Called by destroyAll: emits the connection-limit-exceeded status so
		 * Gutenberg shows the "Too many editors connected" modal, then tears down.
		 */
		function destroyWithLimitError(): void {
			for ( const listener of statusListeners ) {
				listener( {
					status: 'disconnected',
					error: { code: 'connection-limit-exceeded' },
				} );
			}
			destroy();
		}

		/** Tear down this single provider and detach the awareness listener. */
		function destroy(): void {
			if ( destroyed ) {
				return;
			}
			destroyed = true;
			awareness?.off( 'change', onAwarenessChange );
			innerProvider.destroy();
		}

		/** React to awareness changes; trigger global teardown only when this client is in the overflow. */
		function onAwarenessChange(): void {
			if ( destroyed || ! awareness ) {
				return;
			}

			const states = awareness.getStates();
			if ( states.size <= maxPeersPerRoom ) {
				return;
			}

			// Sort connections by join time (oldest first). Use clientID as a
			// tiebreaker so the ordering is deterministic across all peers.
			const sorted = Array.from( states.entries() )
				.map( ( [ clientId, state ] ) => ( {
					clientId,
					joinedAt: ( state?.__wpcomRtcJoinedAt as number ) ?? 0,
				} ) )
				.sort( ( a, b ) => a.joinedAt - b.joinedAt || a.clientId - b.clientId );

			const overflow = sorted.slice( maxPeersPerRoom );
			if ( overflow.some( c => c.clientId === awareness.clientID ) ) {
				destroyAll();
			}
		}

		teardowns.push( destroyWithLimitError );

		if ( awareness ) {
			// Stamp our join time into the awareness state so that all peers
			// can sort connections by join order and agree on who is overflow.
			( awareness as Awareness ).setLocalStateField( '__wpcomRtcJoinedAt', Date.now() );
			awareness.on( 'change', onAwarenessChange );
			onAwarenessChange();
		}

		return {
			destroy: () => {
				const idx = teardowns.indexOf( destroyWithLimitError );
				if ( idx >= 0 ) {
					teardowns.splice( idx, 1 );
				}
				destroy();
			},
			on: ( event: string, callback: ( ...args: unknown[] ) => void ) => {
				if ( event === 'status' ) {
					statusListeners.push( callback );
				}
				innerProvider.on( event, callback );
			},
		};
	};
}
