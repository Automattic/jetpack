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
 * Internal dependencies
 */
import { ReportParamsField } from './components/report-params-field';

/**
 * Widget type definition.
 *
 * Ported from `woocommerce-analytics/average-items-per-order` in
 * woocommerce/woocommerce-analytics (next-woocommerce-analytics).
 *
 * DEMO BRANCH: the `reportParams` attribute is wired to a widget-local,
 * style-free range editor instead of the toolkit's `ReportParamsField` —
 * wp-build's widget metadata build has no style plugins, so the toolkit
 * field's `.module.scss` graph cannot be bundled here. See the comment in
 * `components/report-params-field/report-params-field.tsx` for the full
 * constraint.
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
