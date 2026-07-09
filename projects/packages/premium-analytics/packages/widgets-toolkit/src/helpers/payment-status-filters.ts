/**
 * External dependencies
 */
import type { FilterCondition } from '@jetpack-premium-analytics/data';

/**
 * Filter for order statuses relevant to payment tracking.
 *
 * The Orders API excludes pending/failed/cancelled by default
 * (via woocommerce_excluded_report_order_statuses). The payment
 * status widget needs pending orders for unpaid_net_sales, so we
 * pass an explicit status filter to override the default exclusion.
 *
 * Includes statuses that represent the payment lifecycle: pending
 * (unpaid), processing, on-hold, completed (paid), and refunded.
 * Failed, cancelled, and checkout-draft are excluded because they
 * don't represent meaningful payment states.
 */
export const PAYMENT_STATUS_FILTERS: FilterCondition[] = [
	{
		key: 'status',
		value: [ 'wc-pending', 'wc-processing', 'wc-on-hold', 'wc-completed', 'wc-refunded' ],
		compare: 'IN',
	},
];
