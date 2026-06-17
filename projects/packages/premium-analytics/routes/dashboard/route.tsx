/**
 * External dependencies
 */
import { isSiteRegistered } from '@jetpack-premium-analytics/routing';
import { siteSyncStore } from '@jetpack-premium-analytics/site-sync';
import { select } from '@wordpress/data';
import { redirect } from '@wordpress/route';

/**
 * Route guard for the dashboard.
 * - Not connected → /connect
 * - Connected but sync pending → /syncing
 *
 * Both facts are read from live stores, so the guard routes correctly after a
 * client-side registration or sync completion without a full-page reload.
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
