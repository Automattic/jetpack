/**
 * External dependencies
 */
import { isSiteRegistered } from '@jetpack-premium-analytics/site-sync';
import { redirect } from '@wordpress/route';

/**
 * Route guard for /connect: redirect to the dashboard if the site is already
 * registered.
 */
export const route = {
	beforeLoad: () => {
		if ( isSiteRegistered() ) {
			throw redirect( { to: '/' } );
		}
	},
};
