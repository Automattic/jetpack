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
export type OrdersFulfillmentAttributes = Record< never, never >;

/**
 * Widget type definition.
 *
 * Ported from `woocommerce-analytics/orders-fulfillment` in
 * woocommerce/woocommerce-analytics (next-woocommerce-analytics).
 *
 * Report params intentionally come from the analytics dashboard's global
 * date-range state for now. Adding widget-level overrides needs a host-level
 * control registry so analytics dashboards can hide the field while other
 * dashboards can opt in.
 */
export default {
	name: 'jpa/orders-fulfillment',
	title: __( 'Orders fulfillment', 'jetpack-premium-analytics' ),
	description: __(
		'Shows the breakdown of fulfilled vs unfulfilled order counts over the selected time period.',
		'jetpack-premium-analytics'
	),
	icon: chartBar,
};
