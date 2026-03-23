/**
 * Gutenberg RTC Notices & Limits
 *
 * WP.com-specific entry point for real-time collaboration in the block editor.
 * Registers a sync.providers filter (priority 20) that wraps providers with
 * room-limit enforcement, a filter on editor.SyncConnectionErrorModal to
 * replace Gutenberg's default connection error modal with branded WP.com
 * notices, and a block editor plugin for the welcome notice and admin polling.
 */

import { addFilter } from '@wordpress/hooks';
import { registerPlugin } from '@wordpress/plugins';
import RtcAdminSomeoneWaitingNotice from './notices/rtc-admin-someone-waiting-notice';
import { registerConnectionErrorModalFilter } from './notices/rtc-connection-error-modal-filter';
import RtcNonAdminPostUpgradeNotice from './notices/rtc-non-admin-post-upgrade-notice';
import RtcWelcomeNotice from './notices/rtc-welcome-notice';
import { withRoomLimit } from './room-limit';
import type { ProviderCreator } from '@wordpress/sync';

const enableLimitNotices = window.wpcomRtcNotices?.enableLimitNotices ?? false;

/**
 * Wrap all sync providers with room-limit enforcement.
 * Runs at priority 20 so it wraps providers registered by the rtc package (priority 10).
 */
function registerRoomLimitFilter(): void {
	const config = window.wpcomRtcNotices;
	if ( ! config?.maxPeersPerRoom && ! config?.maxClientsPerUser ) {
		return;
	}

	addFilter(
		'sync.providers',
		'wpcom/rtc-room-limits',
		( providers: ProviderCreator[] ) => {
			return providers.map( creator =>
				withRoomLimit( creator, config.maxPeersPerRoom, config.maxClientsPerUser )
			);
		},
		20
	);

	// Disable Gutenberg's built-in connection limit check so our
	// room-limit.ts handles it with branded notices instead.
	addFilter(
		'sync.pollingProvider.maxClientsPerRoom',
		'wpcom/rtc-disable-builtin-limit',
		() => Number.MAX_SAFE_INTEGER
	);
}

// Room-limit enforcement always runs (it stops polling, sends join requests).
// The branded modals are gated behind enableLimitNotices.
registerRoomLimitFilter();

if ( enableLimitNotices ) {
	registerConnectionErrorModalFilter();
}

const RtcNoticesPlugin = () => {
	return (
		<>
			<RtcWelcomeNotice />
			{ enableLimitNotices && <RtcAdminSomeoneWaitingNotice /> }
			{ enableLimitNotices && <RtcNonAdminPostUpgradeNotice /> }
		</>
	);
};

registerPlugin( 'wpcom-rtc-notices', {
	render: RtcNoticesPlugin,
} );
