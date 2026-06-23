/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { chartBar } from '@wordpress/icons';

/**
 * Widget type definition.
 *
 * Ported from `woocommerce-analytics/new-vs-returning` in
 * woocommerce/woocommerce-analytics (next-woocommerce-analytics).
 *
 * Report params intentionally come from the analytics dashboard's global
 * date-range state for now. Adding widget-level overrides needs a host-level
 * control registry so analytics dashboards can hide the field while other
 * dashboards can opt in.
 */
export default {
	name: 'jpa/new-vs-returning-customer',
	title: __( 'New vs returning customer', 'jetpack-premium-analytics' ),
	description: __(
		'Unique customer counts broken down by new vs returning customers over the selected time period.',
		'jetpack-premium-analytics'
	),
	icon: chartBar,
};
