/**
 * Internal dependencies
 */
import { PRODUCT_SORT_OPTIONS, RESULT_FORMAT_PRODUCT, SORT_OPTIONS } from './constants';

/**
 * Get the available sort options for the provided result format
 *
 * @param   {string} resultFormat - Result format
 * @returns {Map} - Sort options
 */
export function getSortOptions( resultFormat = null ) {
	if ( resultFormat !== RESULT_FORMAT_PRODUCT ) {
		return SORT_OPTIONS;
	}

	// For product results, add additional product sort options
	return new Map( [ ...SORT_OPTIONS, ...PRODUCT_SORT_OPTIONS ] );
}
