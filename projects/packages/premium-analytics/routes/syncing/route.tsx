/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
import { redirect } from '@wordpress/route';

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

		const syncFinished = getScriptData()?.premium_analytics?.initial_full_sync_finished ?? 0;
		if ( syncFinished > 0 ) {
			throw redirect( { to: '/' } );
		}
	},
};
