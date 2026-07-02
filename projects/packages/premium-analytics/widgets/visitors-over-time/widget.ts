/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { seen } from '@wordpress/icons';

/**
 * The widget has no user-configurable attributes. Report params still reach it
 * through WidgetRoot: the dashboard date range, or `attributes.reportParams`
 * when a host injects them (e.g. Storybook and dashboard previews).
 */
export type VisitorsOverTimeAttributes = Record< never, never >;

/**
 * Widget type definition.
 *
 * Ported from `woocommerce-analytics/visitors-over-time` in
 * woocommerce/woocommerce-analytics (next-woocommerce-analytics).
 *
 * Report params intentionally come from the analytics dashboard's global
 * date-range state for now. Adding widget-level overrides needs a host-level
 * control registry so analytics dashboards can hide the field while other
 * dashboards can opt in.
 */
export default {
	name: 'jpa/visitors-over-time',
	title: __( 'Visitors over time', 'jetpack-premium-analytics' ),
	description: __(
		'Track website visitor trends and monitor traffic patterns over time.',
		'jetpack-premium-analytics'
	),
	icon: seen,
};
