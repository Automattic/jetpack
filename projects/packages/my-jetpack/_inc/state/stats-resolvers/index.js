/**
 * Internal dependencies
 */
import { PRODUCT_ID_VIDEOPRESS } from '../constants';
import videoPressStatsResolver from './videopress';

/**
 * Given the productId, select the correct resolver and call it.
 *
 * @param {string} productId - The product name to select the resolver for.
 * @returns {Promise | null} The result of the request, or null if a resolver could not be found.
 */
const resolveProductStatsRequest = async productId => {
	if ( productId === PRODUCT_ID_VIDEOPRESS ) {
		return videoPressStatsResolver();
	}

	return null;
};

export default resolveProductStatsRequest;
