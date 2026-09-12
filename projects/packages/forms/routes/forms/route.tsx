/**
 * WordPress dependencies
 */
import { resolveSelect } from '@wordpress/data';
import { redirect } from '@wordpress/route';
/**
 * Internal dependencies
 */
import { preloadGlobalTabCounts } from '../../src/dashboard/wp-build/utils/preload';
import { CONFIG_STORE } from '../../src/store/config/index.ts';

export const route = {
	/**
	 * Redirect to responses when Central Form Management is disabled.
	 */
	beforeLoad: async () => {
		const config = await resolveSelect( CONFIG_STORE ).getConfig();

		// The resolver reports itself fulfilled while its fetch is still in flight, so a
		// cold load arrives with no config at all — absent is not "disabled".
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
