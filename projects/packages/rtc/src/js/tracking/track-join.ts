import { addFilter } from '@wordpress/hooks';
import { recordRtcEvent } from './tracks';
import type { Awareness, ProviderCreator } from '@wordpress/sync';

const JOIN_EVENT = 'jetpack_rtc_join';

/**
 * Delay between the local client appearing in awareness and snapshotting the
 * contributor list. Peers already in the room sync into awareness within ~1s of
 * connecting; this leaves headroom so an early joiner doesn't record a self-only
 * roster, without waiting so long that the editor may have been closed.
 */
const SETTLE_DELAY_MS = 3000;

interface CollaboratorAwarenessState {
	collaboratorInfo?: { id?: number };
}

/**
 * Build the contributor user-ID list from the current awareness states.
 *
 * A user editing in multiple tabs appears multiple times (same id); distinct
 * users appear as distinct ids. States with no collaborator id are skipped.
 *
 * The ids come from awareness `collaboratorInfo.id`, i.e. the WordPress user id.
 * On Simple sites that is the WordPress.com user id, but on Atomic/Jetpack sites
 * it is the *site-local* WP user id (not the wpcom id used by Tracks' `_ui`), so
 * `contributors` is only meaningful scoped to a single `blog_id`.
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
 * Snapshot the join once the local client is present, after a short settle
 * delay so peers already in the room have time to sync into awareness.
 *
 * Recording at provider-creation time (when awareness is empty) yields a
 * self-only or empty roster; waiting for the local client and then a brief
 * delay lets the snapshot include the peers who were already editing.
 *
 * @param awareness - The Yjs awareness instance for the room.
 */
function recordJoinAfterSettle( awareness: Awareness ): void {
	let scheduled = false;

	const scheduleSnapshot = (): void => {
		if ( scheduled || ! isLocalClientPresent( awareness ) ) {
			return;
		}
		scheduled = true;
		awareness.off( 'change', scheduleSnapshot );
		setTimeout( () => recordJoin( awareness ), SETTLE_DELAY_MS );
	};

	awareness.on( 'change', scheduleSnapshot );
	// Handle the case where the local client is already present at creation time.
	scheduleSnapshot();
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
		const { objectId, awareness } = options;
		if ( objectId !== null && awareness ) {
			recordJoinAfterSettle( awareness );
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
