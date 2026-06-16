/**
 * External dependencies
 */
import { redirect } from '@wordpress/route';
import { getScriptData } from '@automattic/jetpack-script-data';

/**
 * Route guard for /syncing.
 * - Not connected → /connect
 * - Sync already finished → / (dashboard)
 */
export const route = {
	beforeLoad: () => {
		const connectionStatus = getScriptData()?.connection?.connectionStatus;

		if ( ! connectionStatus?.isRegistered ) {
			throw redirect( { to: '/connect' } );
		}

		const config = window.wcAnalyticsConfig;
		if ( config && config.initialSyncDone > 0 ) {
			throw redirect( { to: '/' } );
		}
	},
};
