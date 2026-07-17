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
export type CouponUsageOverTimeAttributes = Record< never, never >;

/**
 * Widget type definition.
 *
 * Ported from the WooCommerce Analytics coupon usage widget.
 *
 * Report params intentionally come from the analytics dashboard's global
 * date-range state for now. Adding widget-level overrides needs a host-level
 * control registry so analytics dashboards can hide the field while other
 * dashboards can opt in.
 */
export default {
	name: 'jpa/coupon-usage-over-time',
	title: __( 'Coupon usage over time', 'jetpack-premium-analytics' ),
	help: {
		content: __(
			'Track how effective your discounts and promotions have been over a set period of time.',
			'jetpack-premium-analytics'
		),
	},
	icon: chartBar,
};
