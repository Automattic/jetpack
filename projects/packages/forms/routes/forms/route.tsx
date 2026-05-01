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

		if ( ! config?.isCentralFormManagementEnabled ) {
			throw redirect( { href: '/responses/inbox' } );
		}
	},

	/**
	 * Preload data before the route renders.
	 */
	loader: async () => {
		await preloadGlobalTabCounts();
	},
};
