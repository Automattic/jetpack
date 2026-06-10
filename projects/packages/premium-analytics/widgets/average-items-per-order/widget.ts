/**
 * External dependencies
 */
import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { chartBar } from '@wordpress/icons';

/**
 * Widget type definition.
 *
 * Ported from `woocommerce-analytics/average-items-per-order` in
 * woocommerce/woocommerce-analytics (next-woocommerce-analytics).
 *
 * The upstream `reportParams` range editor (the toolkit's
 * `ReportParamsField`) is not wired yet: wp-build's widget *metadata*
 * build has no style plugins, and the field's import graph (ui package
 * date pickers) carries `.module.scss`. Until the metadata build gains
 * style support, the widget exposes no editable attributes and new
 * instances start from the default last-30-days range with comparison
 * enabled.
 */
export default {
	name: 'jpa/average-items-per-order',
	title: __( 'Average items per order', 'jetpack-premium-analytics' ),
	description: __(
		'Show the average number of products per order over a set period of time.',
		'jetpack-premium-analytics'
	),
	icon: chartBar,
	example: {
		attributes: {
			reportParams: getDefaultQueryParams( true ),
		},
	},
};
