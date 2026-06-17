/**
 * External dependencies
 */
import { isSiteRegistered, siteSyncStore } from '@jetpack-premium-analytics/site-sync';
import { select } from '@wordpress/data';
import { redirect } from '@wordpress/route';

/**
 * Route guard for the dashboard.
 * - Not connected → /connect
 * - Connected but sync pending → /syncing
 */
export const route = {
	beforeLoad: () => {
		if ( ! isSiteRegistered() ) {
			throw redirect( { to: '/connect' } );
		}

		if ( ! select( siteSyncStore ).isInitialSyncFinished() ) {
			throw redirect( { to: '/syncing' } );
		}
	},
};
