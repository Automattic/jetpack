/**
 * Internal dependencies
 */
import { preloadGlobalTabCounts } from '../../src/dashboard/wp-build/utils/preload';

export const route = {
	/**
	 * Preload data before the route renders.
	 */
	loader: async () => {
		await preloadGlobalTabCounts();
	},
};
