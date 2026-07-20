/**
 * External dependencies
 */
import { redirect } from '@wordpress/route';
/**
 * Internal dependencies
 */
import {
	isPremiumAnalyticsInitialSyncFinished,
	isPremiumAnalyticsSiteConnected,
} from '../site-readiness';

/**
 * Route guard for /syncing.
 * - Not connected → /connect
 * - Sync already finished → / (dashboard)
 */
export const route = {
	beforeLoad: () => {
		if ( ! isPremiumAnalyticsSiteConnected() ) {
			throw redirect( { to: '/connect' } );
		}

		if ( isPremiumAnalyticsInitialSyncFinished() ) {
			throw redirect( { to: '/' } );
		}
	},
};
