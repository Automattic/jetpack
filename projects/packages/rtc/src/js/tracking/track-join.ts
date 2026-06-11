import { addFilter } from '@wordpress/hooks';
import { recordRtcEvent } from './tracks';
import type { Awareness, ProviderCreator } from '@wordpress/sync';

const JOIN_EVENT = 'jetpack_rtc_join';

interface CollaboratorAwarenessState {
	collaboratorInfo?: { id?: number };
}

/**
 * Build the contributor user-ID list from the current awareness states.
 *
 * A user editing in multiple tabs appears multiple times (same id); distinct
 * users appear as distinct ids. States with no collaborator id are skipped.
 *
 * @param awareness - The Yjs awareness instance for the room.
 * @return The WP user IDs currently present in the room.
 */
function getContributorIds( awareness: Awareness ): number[] {
	return Array.from( awareness.getStates().values() )
		.map( state => ( state as CollaboratorAwarenessState )?.collaboratorInfo?.id )
		.filter( ( id ): id is number => typeof id === 'number' );
}

/**
 * Wrap a provider creator so that joining an entity room records a
 * `jetpack_rtc_join` Tracks event. Collection rooms (objectId === null) are
 * ignored, matching the room-limit wrapper.
 *
 * @param creator - The provider creator to wrap.
 * @return The wrapped provider creator.
 */
export function withJoinTracking( creator: ProviderCreator ): ProviderCreator {
	return async options => {
		const result = await creator( options );
		if ( options.objectId !== null && options.awareness ) {
			const contributors = getContributorIds( options.awareness );
			recordRtcEvent( JOIN_EVENT, {
				contributor_count: contributors.length,
				contributors,
			} );
		}
		return result;
	};
}

/**
 * Register the join-tracking wrapper on the sync.providers filter.
 *
 * Runs at priority 30 so it wraps providers after the rtc package (priority 10)
 * and the room-limit wrapper (priority 20).
 */
export function registerJoinTracking(): void {
	addFilter(
		'sync.providers',
		'jetpack/rtc-join-tracking',
		( providers: ProviderCreator[] ) => providers.map( withJoinTracking ),
		30
	);
}
