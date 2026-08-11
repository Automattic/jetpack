/**
 * Internal dependencies
 */
import type { FilterCondition } from '../types/filter-condition';

const PRODUCT_FILTER_KEYS = [ 'product_type', 'virtual', 'downloadable' ];

export function hasProductFilters( filters?: FilterCondition[] ): boolean {
	if ( ! filters || ! Array.isArray( filters ) || filters.length === 0 ) {
		return false;
	}

	return filters.some( filter => PRODUCT_FILTER_KEYS.includes( filter.key ) );
}
