/**
 * External dependencies
 */
import { redirect } from '@wordpress/route';
import { getScriptData } from '@automattic/jetpack-script-data';

declare global {
	interface Window {
		wcAnalyticsConfig?: { initialSyncDone: number };
	}
}

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

		if ( window.wcAnalyticsConfig?.initialSyncDone === 0 ) {
			throw redirect( { to: '/syncing' } );
		}
	},
};
