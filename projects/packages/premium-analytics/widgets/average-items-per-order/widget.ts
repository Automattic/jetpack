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
 * Ported from `woocommerce-analytics/average-items-per-order` in
 * woocommerce/woocommerce-analytics (next-woocommerce-analytics).
 *
 * The `Range` attribute's `Edit` control comes from the fields package,
 * delivered as a script module: the import is externalized rather than
 * bundled, so the styled date-picker graph never enters this metadata
 * module's build (which has no style plugins). See
 * `packages/fields/README.md`.
 */
export default {
	name: 'jpa/average-items-per-order',
	title: __( 'Average items per order', 'jetpack-premium-analytics' ),
	description: __(
		'Show the average number of products per order over a set period of time.',
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
