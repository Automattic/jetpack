/**
 * External dependencies
 */
import { isWpcomPlatformSite } from '@automattic/jetpack-script-data';
import { redirect } from '@wordpress/route';
/**
 * Internal dependencies
 */
import { isPremiumAnalyticsSiteConnected } from '../site-readiness';

/**
 * Route guard for /upgrade: connected Jetpack sites only.
 */
export const route = {
	beforeLoad: () => {
		if ( ! isPremiumAnalyticsSiteConnected() ) {
			throw redirect( { to: '/connect' } );
		}

		if ( isWpcomPlatformSite() ) {
			throw redirect( { to: '/' } );
		}
	},
};
