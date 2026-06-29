import { recordBlocked } from '../tracking/track-blocked';
import type { ProviderCreator, ProviderCreatorResult } from '@wordpress/sync';

/*
 * Module-level state shared across all `withRoomLimit` wrappers.
 *
 * The polling manager in `@wordpress/sync` is a singleton that sends a single
 * HTTP request for every registered room. To fully stop polling when the
 * room limit is reached we must destroy *all* wrapped providers — entity
 * rooms AND collection rooms — in one shot. We only trigger that global
 * teardown when the current client is in the overflow set (newest by enteredAt / clientID).
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
	return ( window as Record< string, unknown > ).__jetpackRtcRoomLimitBreached === true;
}
const teardowns: Array< () => void > = [];

const NOOP_RESULT: ProviderCreatorResult = {
	destroy: () => {},
	on: () => {},
};

/**
 * Wraps a provider creator to enforce a per-room connection limit.
 *
 * All awareness states (connections) are sorted by `collaboratorInfo.enteredAt`
 * with the Yjs `clientID` as a deterministic tiebreaker. When the total number
 * of connections exceeds the allowed maximum, only the current client is
 * considered "overflow" if it is among the newest. In that case all wrapped
 * providers in this window are destroyed.
 *
 * @param creator         - The provider creator to wrap.
 * @param maxPeersPerRoom - Max total connections allowed. Undefined or <= 0 disables enforcement.
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
			( window as Record< string, unknown > ).__jetpackRtcRoomLimitBreached = true;

			// Non-admin: record a join request so the admin gets notified.
			const config = window.jetpackRtcNotices;
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

			// Sort all connections by enteredAt (from collaboratorInfo) so that
			// earlier editors stay in the room. Use clientID as a tiebreaker so
			// every client independently reaches the same ordering without
			// needing to write any new field to the awareness state.
			const sorted = Array.from( states.entries() )
				.map( ( [ clientId, state ] ) => ( {
					clientId,
					enteredAt: ( state?.collaboratorInfo as { enteredAt?: unknown } | undefined )?.enteredAt,
				} ) )
				.sort( ( a, b ) => {
					const aTime = typeof a.enteredAt === 'number' ? a.enteredAt : Infinity;
					const bTime = typeof b.enteredAt === 'number' ? b.enteredAt : Infinity;
					if ( aTime !== bTime ) {
						return aTime - bTime;
					}
					return a.clientId - b.clientId;
				} );

			const overflow = sorted.slice( maxPeersPerRoom );
			if ( overflow.some( c => c.clientId === awareness.clientID ) ) {
				recordBlocked( awareness );
				destroyAll();
			}
		}

		teardowns.push( destroyWithLimitError );

		// Only enforce the peer limit on entity rooms (objectId !== null).
		// Collection rooms (objectId === null) are shared across posts, so
		// their awareness aggregates all editors site-wide — not just those
		// on the same post. Monitoring them would cause the limit to behave
		// as a global cap instead of a per-post cap.
		const isEntityRoom = options.objectId !== null;

		if ( awareness && isEntityRoom ) {
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
					// Forward inner-provider status events only while the limit
					// has not been breached. Once breached, destroyWithLimitError
					// emits connection-limit-exceeded directly; subsequent events
					// from the inner provider (e.g. PingHub's own disconnect)
					// must not overwrite that with a generic "Connection lost".
					innerProvider.on( event, ( ...args: unknown[] ) => {
						if ( ! breached ) {
							callback( ...args );
						}
					} );
				} else {
					innerProvider.on( event, callback );
				}
			},
		};
	};
}
