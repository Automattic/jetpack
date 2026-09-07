/**
 * WordPress dependencies
 */
import { chartBar } from '@wordpress/icons';

/**
 * No user-configurable attributes; report params still reach the widget through
 * WidgetRoot (dashboard date range, or `attributes.reportParams` from a host).
 */
export type RevenueByCustomerTypeAttributes = Record< never, never >;

/**
 * Ported from `woocommerce-analytics/revenue-by-customer-type` in
 * woocommerce/woocommerce-analytics (next-woocommerce-analytics).
 *
 * Report params intentionally come from the analytics dashboard's global
 * date-range state for now. Adding widget-level overrides needs a host-level
 * control registry so analytics dashboards can hide the field while other
 * dashboards can opt in.
 */
export default {
	icon: chartBar,
};
