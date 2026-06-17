/**
 * External dependencies
 */
import { isSiteRegistered } from '@jetpack-premium-analytics/routing';
import { redirect } from '@wordpress/route';

/**
 * Route guard for /connect.
 * If the site is already connected, redirect to the dashboard.
 *
 * Registration is read live (see `isSiteRegistered`), so a client-side
 * registration is reflected without a full-page reload.
 */
export const route = {
	beforeLoad: () => {
		if ( isSiteRegistered() ) {
			throw redirect( { to: '/' } );
		}
	},
};
