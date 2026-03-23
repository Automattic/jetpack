import type { ProviderCreator, ProviderCreatorResult } from '@wordpress/sync';
import type { Awareness } from 'y-protocols/awareness';

/*
 * Module-level state shared across all `withRoomLimit` wrappers.
 *
 * The polling manager in `@wordpress/sync` is a singleton that sends a single
 * HTTP request for every registered room. To fully stop polling when the
 * room limit is reached we must destroy *all* wrapped providers — entity
 * rooms AND collection rooms — in one shot. We only trigger that global
 * teardown when the current client is in the overflow set (newest by enteredAt).
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
 * Build a sorted list of unique collaborators (by WordPress user ID), ordered
 * by the time they entered the room.
 *
 * The earliest `enteredAt` value for each user is used so that multiple tabs
 * for the same user share a single, stable "join time".
 *
 * @param awareness - The Yjs awareness instance.
 * @return Array of user descriptors sorted by enter time.
 */
function getSortedCollaborators(
	awareness: Awareness
): Array< { id: number; enteredAt: number } > {
	const byId = new Map< number, number >();

	for ( const [ , state ] of awareness.getStates() ) {
		const info = state?.collaboratorInfo as { id?: unknown; enteredAt?: unknown } | undefined;
		const id = info?.id;
		const enteredAt = info?.enteredAt;
		if ( typeof id !== 'number' || typeof enteredAt !== 'number' ) {
			continue;
		}
		const prev = byId.get( id );
		if ( prev === undefined || enteredAt < prev ) {
			byId.set( id, enteredAt );
		}
	}

	return Array.from( byId.entries() )
		.map( ( [ id, enteredAt ] ) => ( { id, enteredAt } ) )
		.sort( ( a, b ) => {
			if ( a.enteredAt !== b.enteredAt ) {
				return a.enteredAt - b.enteredAt;
			}
			return a.id - b.id;
		} );
}

/**
 * Build a sorted list of clients (tabs) for the local WordPress user, ordered
 * by when they entered the room (earliest enteredAt per clientId).
 *
 * @param awareness   - The Yjs awareness instance.
 * @param localUserId - The WordPress user ID to filter by.
 * @return Array of client descriptors sorted by enter time.
 */
function getSortedClientsForLocalUser(
	awareness: Awareness,
	localUserId: number
): Array< { clientId: number; enteredAt: number } > {
	const byClientId = new Map< number, number >();

	for ( const [ clientId, state ] of awareness.getStates() ) {
		const info = state?.collaboratorInfo as { id?: unknown; enteredAt?: unknown } | undefined;
		if ( info?.id !== localUserId || typeof info?.enteredAt !== 'number' ) {
			continue;
		}
		const enteredAt = info.enteredAt as number;
		const prev = byClientId.get( clientId );
		if ( prev === undefined || enteredAt < prev ) {
			byClientId.set( clientId, enteredAt );
		}
	}

	return Array.from( byClientId.entries() )
		.map( ( [ clientId, enteredAt ] ) => ( { clientId, enteredAt } ) )
		.sort( ( a, b ) => {
			if ( a.enteredAt !== b.enteredAt ) {
				return a.enteredAt - b.enteredAt;
			}
			return a.clientId - b.clientId;
		} );
}

/**
 * Wraps a provider creator to enforce a per-room user limit.
 *
 * Collaborators are ordered by `enteredAt`. When the total number of unique
 * users (or clients for the same user) exceeds the allowed maximum, only the
 * current client is considered "overflow" if it is among the newest (by enteredAt).
 * In that case all wrapped providers in this window are destroyed.
 *
 * @param creator           - The provider creator to wrap.
 * @param maxPeersPerRoom   - Max other unique users allowed. Undefined or <= 0 disables peer enforcement.
 * @param maxClientsPerUser - Max additional clients (tabs) for the same user. Undefined or <= 0 disables per-user enforcement.
 * @return Wrapped provider creator.
 */
export function withRoomLimit(
	creator: ProviderCreator,
	maxPeersPerRoom?: number,
	maxClientsPerUser?: number
): ProviderCreator {
	const hasPeerLimit = Boolean( maxPeersPerRoom && maxPeersPerRoom > 0 );
	const hasClientLimit = Boolean( maxClientsPerUser && maxClientsPerUser > 0 );
	if ( ! hasPeerLimit && ! hasClientLimit ) {
		return creator;
	}

	return async ( options ): Promise< ProviderCreatorResult > => {
		if ( breached ) {
			return NOOP_RESULT;
		}

		const { awareness } = options;
		const innerProvider = await creator( options );
		let destroyed = false;

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

			const localUserId = awareness.getLocalState()?.collaboratorInfo?.id;
			if ( typeof localUserId !== 'number' ) {
				return;
			}

			// Peer limit: too many unique users; only newest users (by enteredAt) are overflow.
			if ( hasPeerLimit ) {
				const collaborators = getSortedCollaborators( awareness );
				if ( collaborators.length > maxPeersPerRoom! ) {
					const overflow = collaborators.slice( maxPeersPerRoom );
					if ( overflow.some( user => user.id === localUserId ) ) {
						destroyAll();
						return;
					}
				}
			}

			// Client limit: too many tabs for this user; only newest clients (by enteredAt) are overflow.
			if ( hasClientLimit ) {
				const localClientId = ( awareness as Awareness & { clientID?: unknown } ).clientID;
				if ( typeof localClientId !== 'number' ) {
					return;
				}
				const clientsForUser = getSortedClientsForLocalUser( awareness, localUserId );
				if ( clientsForUser.length > maxClientsPerUser! ) {
					const overflow = clientsForUser.slice( maxClientsPerUser );
					if ( overflow.some( c => c.clientId === localClientId ) ) {
						destroyAll();
					}
				}
			}
		}

		teardowns.push( destroy );

		if ( awareness ) {
			awareness.on( 'change', onAwarenessChange );
			onAwarenessChange();
		}

		return {
			destroy: () => {
				const idx = teardowns.indexOf( destroy );
				if ( idx >= 0 ) {
					teardowns.splice( idx, 1 );
				}
				destroy();
			},
			on: innerProvider.on.bind( innerProvider ),
		};
	};
}
