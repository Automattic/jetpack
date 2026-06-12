import { addFilter } from '@wordpress/hooks';
import { isRoomLimitBreached } from '../notices/room-limit';
import { getContributorIds, getLocalUserId } from './awareness';
import { recordRtcEvent } from './tracks';
import type { Awareness, ProviderCreator } from '@wordpress/sync';

const JOIN_EVENT = 'jetpack_rtc_join';

/**
 * Delay between the local client appearing in awareness and snapshotting the
 * contributor list, to give peers already in the room time to sync in. PingHub
 * propagates awareness sub-second; HTTP-polling is slower (a poll cycle), so the
 * roster stays best-effort there — see the limitation note on `getContributorIds`.
 */
const SETTLE_DELAY_MS = 3000;

/**
 * Whether the local client's presence has been established in awareness.
 *
 * @param awareness - The Yjs awareness instance for the room.
 * @return True once the local client has a collaborator id in awareness.
 */
function isLocalClientPresent( awareness: Awareness ): boolean {
	return typeof getLocalUserId( awareness ) === 'number';
}

/**
 * Record the join event with a snapshot of the contributors currently present.
 *
 * `transport`, `post_id`, `post_type`, and `wp_user_id` are added by
 * `recordRtcEvent`; this only supplies the room roster.
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
 * Snapshot the join once the local client is present, after `SETTLE_DELAY_MS`
 * so peers already in the room have time to sync into awareness.
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
		setTimeout( () => {
			// A client turned away by the room limit emits jetpack_rtc_blocked,
			// not a join, so skip the snapshot if the limit was breached while we
			// were waiting (its provider has also been torn down by then).
			if ( ! isRoomLimitBreached() ) {
				recordJoin( awareness );
			}
		}, SETTLE_DELAY_MS );
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
