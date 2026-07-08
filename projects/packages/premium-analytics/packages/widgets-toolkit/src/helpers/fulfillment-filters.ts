/**
 * External dependencies
 */
import type { FilterCondition } from '@jetpack-premium-analytics/data';

/**
 * Filter for fulfilled orders only.
 */
export const FULFILLED_ORDERS_FILTER: FilterCondition = {
	key: 'fulfillment_status',
	value: 'fulfilled',
	compare: '=',
};

/**
 * Filter for unfulfilled orders (includes orders with no fulfillments).
 */
export const UNFULFILLED_ORDERS_FILTER: FilterCondition = {
	key: 'fulfillment_status',
	value: [ 'unfulfilled', 'no_fulfillments' ],
	compare: 'IN',
};
