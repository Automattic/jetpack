/*** THIS MUST BE THE FIRST THING EVALUATED IN THIS SCRIPT *****/
import './public-path';

/**
 * Gutenberg RTC Notices & Limits
 *
 * Entry point for real-time collaboration notices in the block editor.
 * Registers a sync.providers filter (priority 20) that wraps providers with
 * room-limit enforcement, a filter on editor.SyncConnectionErrorModal to
 * replace Gutenberg's default connection error modal with RTC-specific
 * notices, and a block editor plugin for admin polling.
 */

import { addFilter } from '@wordpress/hooks';
import { registerPlugin } from '@wordpress/plugins';
import { registerConnectionErrorTracking } from '../tracking/track-connection-error';
import { registerJoinTracking } from '../tracking/track-join';
import RtcAdminSomeoneWaitingNotice from './notices/rtc-admin-someone-waiting-notice';
import { registerConnectionErrorModalFilter } from './notices/rtc-connection-error-modal-filter';
import RtcNonAdminPostUpgradeNotice from './notices/rtc-non-admin-post-upgrade-notice';
import { withRoomLimit } from './room-limit';
import type { ProviderCreator } from '@wordpress/sync';

const enableLimitNotices = window.jetpackRtcNotices?.enableLimitNotices ?? false;

/**
 * Wrap all sync providers with room-limit enforcement.
 * Runs at priority 20 so it wraps providers registered by the rtc package (priority 10).
 */
function registerRoomLimitFilter(): void {
	const config = window.jetpackRtcNotices;
	if ( ! config?.maxPeersPerRoom ) {
		return;
	}

	addFilter(
		'sync.providers',
		'jetpack/rtc-room-limits',
		( providers: ProviderCreator[] ) => {
			return providers.map( creator => withRoomLimit( creator, config.maxPeersPerRoom ) );
		},
		20
	);

	addFilter(
		'sync.pollingProvider.maxClientsPerRoom',
		'jetpack/rtc-disable-builtin-limit',
		() => Number.MAX_SAFE_INTEGER
	);
}

// Join tracking runs on every site with RTC, regardless of the room limit.
registerJoinTracking();

// Connection-error tracking also runs everywhere; it skips the room-limit case
// (recorded separately as jetpack_rtc_blocked) to avoid double-counting.
registerConnectionErrorTracking();

// Room-limit enforcement always runs (it stops polling, sends join requests).
// The branded modals are gated behind enableLimitNotices.
registerRoomLimitFilter();

if ( enableLimitNotices ) {
	registerConnectionErrorModalFilter();
}

const RtcNoticesPlugin = () => {
	return (
		<>
			{ enableLimitNotices && <RtcAdminSomeoneWaitingNotice /> }
			{ enableLimitNotices && <RtcNonAdminPostUpgradeNotice /> }
		</>
	);
};

registerPlugin( 'jetpack-rtc-notices', {
	render: RtcNoticesPlugin,
} );
