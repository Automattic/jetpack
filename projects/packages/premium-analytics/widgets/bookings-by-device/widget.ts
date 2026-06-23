/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { chartBar } from '@wordpress/icons';

/**
 * Widget type definition.
 *
 * Ported from `woocommerce-analytics/bookings-by-device` in
 * woocommerce/woocommerce-analytics (next-woocommerce-analytics).
 *
 * Report params intentionally come from the analytics dashboard's global
 * date-range state for now. Adding widget-level overrides needs a host-level
 * control registry so analytics dashboards can hide the field while other
 * dashboards can opt in.
 */
export default {
	name: 'jpa/bookings-by-device',
	title: __( 'Bookings by device', 'jetpack-premium-analytics' ),
	description: __(
		'See which devices your customers are using to make bookings in your store.',
		'jetpack-premium-analytics'
	),
	icon: chartBar,
};
