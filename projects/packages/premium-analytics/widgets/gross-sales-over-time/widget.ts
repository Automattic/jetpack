/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { chartBar } from '@wordpress/icons';

/**
 * Widget type definition.
 *
 * Ported from the WooCommerce Analytics gross sales over time widget.
 *
 * Report params intentionally come from the analytics dashboard's global
 * date-range state for now. Adding widget-level overrides needs a host-level
 * control registry so analytics dashboards can hide the field while other
 * dashboards can opt in.
 */
export default {
	name: 'jpa/gross-sales-over-time',
	title: __( 'Gross sales over time', 'jetpack-premium-analytics' ),
	description: __( 'Gross sales over the selected time period.', 'jetpack-premium-analytics' ),
	icon: chartBar,
};
