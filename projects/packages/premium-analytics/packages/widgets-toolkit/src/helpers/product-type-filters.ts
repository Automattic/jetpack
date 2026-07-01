/**
 * External dependencies
 */
import type { FilterCondition } from '@jetpack-premium-analytics/data';

/**
 * Product type filter constants for coupon-based widgets.
 *
 * These filters are used to segment coupon sales data by product type.
 * Each widget instance should specify which filter to use based on
 * the product category it targets.
 *
 * @see https://github.com/woocommerce/woocommerce-analytics/blob/develop/src/Utilities/OrderProductTypeTracker.php
 */

/**
 * Filter for physical products only.
 * Includes: simple, variable, and variation product types.
 * Excludes: digital/downloadable products and bookings.
 */
export const PHYSICAL_PRODUCTS_FILTER: FilterCondition = {
	key: 'product_type',
	value: [ 'simple', 'variable', 'variation' ],
	compare: 'IN',
};

/**
 * Filter for booking products only.
 * Includes: booking, bookable-event, and bookable-service product types.
 * Used by WooCommerce Bookings extension.
 *
 * @see OrderProductTypeTracker::BOOKINGS_TYPES
 */
export const BOOKINGS_FILTER: FilterCondition = {
	key: 'product_type',
	value: [ 'booking', 'bookable-event', 'bookable-service' ],
	compare: 'IN',
};
