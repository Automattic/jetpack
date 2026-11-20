/**
 * Internal dependencies
 */
import type { FilterCondition } from '../types/filter-condition';

/**
 * The payment lifecycle statuses. The orders report excludes pending orders by default, and the
 * unpaid revenue lives there, so the filter names every status it needs.
 */
export const PAYMENT_STATUS_FILTERS: FilterCondition[] = [
	{
		key: 'status',
		value: [ 'wc-pending', 'wc-processing', 'wc-on-hold', 'wc-completed', 'wc-refunded' ],
		compare: 'IN',
	},
];

export const FULFILLED_ORDERS_FILTER: FilterCondition = {
	key: 'fulfillment_status',
	value: 'fulfilled',
	compare: '=',
};

/** Unfulfilled orders, including those with no fulfillment record at all. */
export const UNFULFILLED_ORDERS_FILTER: FilterCondition = {
	key: 'fulfillment_status',
	value: [ 'unfulfilled', 'no_fulfillments' ],
	compare: 'IN',
};
