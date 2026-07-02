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
export type NetSalesOverTimeAttributes = Record< never, never >;

/**
 * Widget type definition.
 *
 * Ported from `woocommerce-analytics/net-sales-over-time` in
 * woocommerce/woocommerce-analytics (next-woocommerce-analytics).
 *
 * Report params intentionally come from the analytics dashboard's global
 * date-range state for now. Adding widget-level overrides needs a host-level
 * control registry so analytics dashboards can hide the field while other
 * dashboards can opt in.
 */
export default {
	name: 'jpa/net-sales-over-time',
	title: __( 'Net sales over time', 'jetpack-premium-analytics' ),
	description: __(
		'Monitor your total revenue after discounts, returns, or adjustments over a set period of time.',
		'jetpack-premium-analytics'
	),
	icon: chartBar,
};
