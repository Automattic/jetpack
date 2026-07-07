/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { store } from '@wordpress/icons';

/**
 * Widget type definition.
 *
 * Ported from `woocommerce-analytics/at-a-glance` in
 * woocommerce/woocommerce-analytics (next-woocommerce-analytics).
 *
 * Report params intentionally come from the analytics dashboard's global
 * date-range state for now. Adding widget-level overrides needs a host-level
 * control registry so analytics dashboards can hide the field while other
 * dashboards can opt in.
 */
export default {
	name: 'jpa/store-performance',
	title: __( 'Store performance', 'jetpack-premium-analytics' ),
	description: __(
		'Shows key store performance metrics at a glance.',
		'jetpack-premium-analytics'
	),
	icon: store,
};
