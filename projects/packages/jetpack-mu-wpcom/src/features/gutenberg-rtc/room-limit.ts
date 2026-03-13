import type { ProviderCreator, ProviderCreatorResult } from '@wordpress/sync';
import type { Awareness } from 'y-protocols/awareness';

/*
 * Module-level state shared across all `withRoomLimit` wrappers.
 *
 * The polling manager in `@wordpress/sync` is a singleton that sends a single
 * HTTP request for every registered room. To fully stop polling when the
 * room limit is reached we must destroy *all* wrapped providers — entity
 * rooms AND collection rooms — in one shot.
 */
let breached = false;
const teardowns: Array< () => void > = [];

const NOOP_RESULT: ProviderCreatorResult = {
	destroy: () => {},
	on: () => {},
};

/**
 * Count unique WordPress user IDs in the room, excluding the local user.
 *
 * @param awareness - The Yjs awareness instance.
 * @return Number of other unique users, or -1 when the local user is not identifiable yet.
 */
function countOtherUsers( awareness: Awareness ): number {
	const localUserId = awareness.getLocalState()?.collaboratorInfo?.id;
	if ( typeof localUserId !== 'number' ) {
		return -1;
	}

	const ids = new Set< number >();
	for ( const [ , state ] of awareness.getStates() ) {
		const uid = state?.collaboratorInfo?.id;
		if ( typeof uid === 'number' && uid !== localUserId ) {
			ids.add( uid );
		}
	}
	return ids.size;
}

/**
 * Wraps a provider creator to enforce a per-room user limit.
 *
 * On every awareness change the wrapper counts unique WordPress user IDs
 * (via `collaboratorInfo.id`) excluding the local user. When the count
 * reaches the given limit every provider created through `withRoomLimit`
 * is destroyed, which causes the shared polling manager to stop entirely.
 *
 * @param creator         - The provider creator to wrap.
 * @param maxPeersPerRoom - Max other unique users allowed. Undefined or ≤ 0 disables enforcement.
 * @return Wrapped provider creator.
 */
export function withRoomLimit(
	creator: ProviderCreator,
	maxPeersPerRoom?: number
): ProviderCreator {
	if ( ! maxPeersPerRoom || maxPeersPerRoom <= 0 ) {
		return creator;
	}

	const limit = maxPeersPerRoom;

	return async ( options ): Promise< ProviderCreatorResult > => {
		if ( breached ) {
			return NOOP_RESULT;
		}

		const { awareness } = options;
		const innerProvider = await creator( options );
		let destroyed = false;

		/** Tear down this single provider and detach the awareness listener. */
		function destroy(): void {
			if ( destroyed ) {
				return;
			}
			destroyed = true;
			awareness?.off( 'change', onAwarenessChange );
			innerProvider.destroy();
		}

		/** React to awareness changes and trigger a global teardown when the limit is reached. */
		function onAwarenessChange(): void {
			if ( destroyed || ! awareness ) {
				return;
			}

			const others = countOtherUsers( awareness );
			if ( others >= limit ) {
				breached = true;
				for ( const fn of teardowns ) {
					fn();
				}
				teardowns.length = 0;
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
