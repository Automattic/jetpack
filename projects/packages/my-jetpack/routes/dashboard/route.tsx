import { redirect } from '@wordpress/route';
import { getLegacyHashHref } from '../../_inc/utils/route-href';

export const route = {
	/**
	 * Sends a `#/…` link to the route it names, keeping its query.
	 *
	 * Permanent: My Jetpack's PHP, other plugins, Calypso and wpcom all link with `#/…`, at any version.
	 * Runs on every navigation, so an in-page `#/add-backup` anchor is redirected too.
	 */
	beforeLoad: () => {
		const href = getLegacyHashHref( window.location.hash );

		if ( href ) {
			throw redirect( { href, replace: true } );
		}
	},
};
