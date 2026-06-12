/**
 * External dependencies
 */
import { getDefaultQueryParams } from '@jetpack-premium-analytics/data';
import { ReportParamsField } from '@jetpack-premium-analytics/fields';
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { chartBar } from '@wordpress/icons';

/**
 * Widget type definition.
 *
 * Ported from `woocommerce-analytics/average-order-value-over-time` in
 * woocommerce/woocommerce-analytics (next-woocommerce-analytics).
 *
 * Added on this experimental branch as the second data-driven widget
 * type: it fetches the same orders report as average-items-per-order, so
 * with the data package externalized as a shared script module, both
 * widget types should be served by a single pair of report requests.
 */
export default {
	name: 'jpa/average-order-value',
	title: __( 'Average order value', 'jetpack-premium-analytics' ),
	description: __(
		'Track the average value of each order over a set period of time.',
		'jetpack-premium-analytics'
	),
	icon: chartBar,
	attributes: [
		{
			id: 'reportParams',
			label: __( 'Range', 'jetpack-premium-analytics' ),
			Edit: ReportParamsField,
		},
	],
	example: {
		attributes: {
			reportParams: getDefaultQueryParams( true ),
		},
	},
};
