/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { chartBar } from '@wordpress/icons';

/**
 * The widget has no user-configurable attributes. Report params still reach it
 * through WidgetRoot: the dashboard date range, or `attributes.reportParams`
 * when a host injects them (e.g. Storybook and dashboard previews).
 */
export type BookingsRevenueByCustomerTypeAttributes = Record< never, never >;

/**
 * Widget type definition.
 *
 * Ported from `woocommerce-analytics/bookings-revenue-by-customer-type` in
 * woocommerce/woocommerce-analytics (next-woocommerce-analytics).
 *
 * Report params intentionally come from the analytics dashboard's global
 * date-range state for now. Adding widget-level overrides needs a host-level
 * control registry so analytics dashboards can hide the field while other
 * dashboards can opt in.
 */
export default {
	name: 'jpa/bookings-revenue-by-customer-type',
	title: __( 'Bookings revenue by customer type', 'jetpack-premium-analytics' ),
	help: {
		content: __(
			'Revenue breakdown from new customers vs returning customers for bookings over the selected time period.',
			'jetpack-premium-analytics'
		),
	},
	icon: chartBar,
};
