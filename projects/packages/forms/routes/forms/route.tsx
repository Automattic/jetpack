/**
 * WordPress dependencies
 */
import { redirect } from '@wordpress/route';
/**
 * Internal dependencies
 */
import { preloadGlobalTabCounts } from '../../src/dashboard/wp-build/utils/preload';
import { waitForConfig } from '../../src/store/config/wait-for-config.ts';

export const route = {
	/**
	 * Redirect to responses when Central Form Management is disabled.
	 */
	beforeLoad: async () => {
		const config = await waitForConfig();

		// Null only when the fetch failed, which says nothing about the flag.
		if ( config && ! config.isCentralFormManagementEnabled ) {
			throw redirect( { href: '/responses/inbox' } );
		}
	},

	/**
	 * Starts loading the tab counts as the route is entered.
	 *
	 * Deliberately not awaited: the router blocks navigation on a loader that returns a
	 * promise, and the counts only feed the tab badges.
	 */
	loader: () => {
		preloadGlobalTabCounts().catch( () => {} );
	},
};
