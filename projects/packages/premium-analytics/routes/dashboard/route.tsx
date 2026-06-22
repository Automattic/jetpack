/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
import { redirect } from '@wordpress/route';

/**
 * Route guard for the dashboard.
 * - Not connected → /connect
 * - Connected but sync pending → /syncing
 */
export const route = {
	beforeLoad: () => {
		const connectionStatus = getScriptData()?.connection?.connectionStatus;

		if ( ! connectionStatus?.isRegistered ) {
			throw redirect( { to: '/connect' } );
		}

		const syncFinished = getScriptData()?.premium_analytics?.initial_full_sync_finished ?? 0;
		if ( ! syncFinished ) {
			throw redirect( { to: '/syncing' } );
		}
	},
};
