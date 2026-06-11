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
 * Whether the local client's presence has been established in awareness.
 *
 * The local awareness state (with collaboratorInfo) is populated by core-data
 * shortly after the provider is created, not synchronously, so this is false
 * at provider-creation time.
 *
 * @param awareness - The Yjs awareness instance for the room.
 * @return True once the local client has a collaborator id in awareness.
 */
function isLocalClientPresent( awareness: Awareness ): boolean {
	const localState = awareness.getStates().get( awareness.clientID ) as
		| CollaboratorAwarenessState
		| undefined;
	return typeof localState?.collaboratorInfo?.id === 'number';
}

/**
 * Record the join event with a snapshot of the contributors currently present.
 *
 * @param awareness - The Yjs awareness instance for the room.
 */
function recordJoin( awareness: Awareness ): void {
	const contributors = getContributorIds( awareness );
	recordRtcEvent( JOIN_EVENT, {
		contributor_count: contributors.length,
		contributors,
	} );
}

/**
 * Wrap a provider creator so that joining an entity room records a
 * `jetpack_rtc_join` Tracks event. Collection rooms (objectId === null) are
 * ignored, matching the room-limit wrapper.
 *
 * The contributor snapshot is taken once the local client's presence is
 * established in awareness, not at provider-creation time (when awareness is
 * still empty), so the event always includes at least the local user.
 *
 * @param creator - The provider creator to wrap.
 * @return The wrapped provider creator.
 */
export function withJoinTracking( creator: ProviderCreator ): ProviderCreator {
	return async options => {
		const result = await creator( options );
		const { objectId, awareness } = options;
		if ( objectId === null || ! awareness ) {
			return result;
		}

		if ( isLocalClientPresent( awareness ) ) {
			recordJoin( awareness );
		} else {
			const onChange = () => {
				if ( isLocalClientPresent( awareness ) ) {
					awareness.off( 'change', onChange );
					recordJoin( awareness );
				}
			};
			awareness.on( 'change', onChange );
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
