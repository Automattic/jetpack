/**
 * External dependencies
 */
import { redirect } from '@wordpress/route';
/**
 * Internal dependencies
 */
import { isPremiumAnalyticsSiteConnected } from '../site-readiness';

/**
 * Route guard for /connect.
 * If the site is already connected, redirect to the dashboard.
 */
export const route = {
	beforeLoad: () => {
		if ( isPremiumAnalyticsSiteConnected() ) {
			throw redirect( { to: '/' } );
		}
	},
};
