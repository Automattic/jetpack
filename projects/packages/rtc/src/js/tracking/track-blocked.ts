import { getContributorIds } from './awareness';
import { recordRtcEvent } from './tracks';
import type { Awareness } from '@wordpress/sync';

const BLOCKED_EVENT = 'jetpack_rtc_blocked';

/**
 * Record a `jetpack_rtc_blocked` Tracks event for the local client when it is
 * turned away from a post because the per-room contributor limit was reached.
 *
 * Called from the room-limit overflow path. `transport`, `post_id`, `post_type`,
 * and `wp_user_id` are added by `recordRtcEvent` (from the server-injected
 * config, so they are reliable even though the block fires before the local
 * client's own awareness/editor state is populated). The blocked user is the
 * local client — its `wp_user_id` is in the same id-space as `contributors`. See
 * `getContributorIds` for the id-space caveats.
 *
 * @param awareness - The Yjs awareness instance for the room.
 */
export function recordBlocked( awareness: Awareness ): void {
	const contributors = getContributorIds( awareness );
	const config = window.jetpackRtcNotices;
	recordRtcEvent( BLOCKED_EVENT, {
		contributor_count: contributors.length,
		contributors,
		is_admin: config?.isAdmin ?? false,
		is_plan_owner: config?.isPlanOwner ?? false,
	} );
}
