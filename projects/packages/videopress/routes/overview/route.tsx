/**
 * WordPress dependencies
 */
import { redirect } from '@wordpress/route';

export const route = {
	/**
	 * Reconcile legacy hash-router links from the pre-wp-build dashboard.
	 *
	 * Old links pointed at `#/video/<id>/edit`. The hash is never sent to the
	 * server, so those links land on the index route with no `p` arg; convert
	 * them client-side to the modernized `/video/<id>` route.
	 */
	beforeLoad: () => {
		const legacyMatch = window.location.hash.match( /^#\/video\/(\d+)(?:\/edit)?\/?$/ );

		if ( legacyMatch ) {
			throw redirect( { href: `/video/${ legacyMatch[ 1 ] }` } );
		}
	},
};
