/**
 * Internal dependencies
 */
import type { FilterCondition } from '../types/filter-condition';

/**
 * Product lookup table level filters.
 */
const PRODUCT_FILTER_KEYS = [ 'product_type', 'virtual', 'downloadable' ];

/**
 * Checks if any of the provided filters are product-related filters
 *
 * @param filters - Array of filter conditions to check
 * @return True if any filter is product-related, false otherwise
 */
export function hasProductFilters( filters?: FilterCondition[] ): boolean {
	if ( ! filters || ! Array.isArray( filters ) || filters.length === 0 ) {
		return false;
	}

	return filters.some( filter => PRODUCT_FILTER_KEYS.includes( filter.key ) );
}
