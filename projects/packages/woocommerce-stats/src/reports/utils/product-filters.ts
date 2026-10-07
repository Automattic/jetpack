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

/** The booking product types, as WooCommerce Bookings sells them. */
export const BOOKINGS_FILTER: FilterCondition = {
	key: 'product_type',
	value: [ 'booking', 'bookable-event', 'bookable-service' ],
	compare: 'IN',
};
