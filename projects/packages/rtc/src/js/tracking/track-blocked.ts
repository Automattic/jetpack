import { getContributorIds, getLocalUserId } from './awareness';
import { recordRtcEvent } from './tracks';
import type { Awareness } from '@wordpress/sync';

const BLOCKED_EVENT = 'jetpack_rtc_blocked';

/**
 * Record a `jetpack_rtc_blocked` Tracks event for the local client when it is
 * turned away from a post because the per-room contributor limit was reached.
 *
 * Called from the room-limit overflow path, so the snapshot is taken at the
 * moment of the block — when the room is over capacity and the roster is at its
 * most complete (unlike the join snapshot, no settle delay is needed). The
 * blocked user is the local client (`wp_user_id`) and is included in
 * `contributors`. See `getContributorIds` for the id-space caveats.
 *
 * @param awareness - The Yjs awareness instance for the room.
 */
export function recordBlocked( awareness: Awareness ): void {
	const contributors = getContributorIds( awareness );
	const config = window.jetpackRtcNotices;
	recordRtcEvent( BLOCKED_EVENT, {
		wp_user_id: getLocalUserId( awareness ),
		contributor_count: contributors.length,
		contributors,
		is_admin: config?.isAdmin ?? false,
		is_plan_owner: config?.isPlanOwner ?? false,
	} );
}
