/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { trendingUp } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';
/**
 * Internal dependencies
 */
import type { StatsUtmParam } from '@jetpack-premium-analytics/data';

/**
 * Widget attributes shape.
 *
 * @property utmDimension - UTM dimension to break down by. Defaults to 'utm_source,utm_medium'.
 * @property max          - Maximum rows to display (0 = all). Defaults to 10.
 */
export type UtmInsightsAttributes = {
	utmDimension?: StatsUtmParam;
	max?: number;
};

/**
 * UTM Insights widget type definition.
 *
 * Shows traffic breakdown by UTM parameter via the PA proxy at
 * `stats/utm/{utmParam}`. The active dimension is the `utmDimension`
 * attribute (`relevance: 'high'`), so the widget host renders its
 * control. Date range comes from WidgetRoot's reportParams (the
 * shared dashboard date picker).
 */
export default {
	name: 'jpa/utm-insights',
	title: __( 'UTM Insights', 'jetpack-premium-analytics' ),
	icon: trendingUp,
	attributes: [
		{
			id: 'utmDimension',
			label: __( 'UTM parameter', 'jetpack-premium-analytics' ),
			type: 'text',
			elements: [
				{
					label: __( 'Source / Medium', 'jetpack-premium-analytics' ),
					value: 'utm_source,utm_medium',
				},
				{
					label: __( 'Campaign / Source / Medium', 'jetpack-premium-analytics' ),
					value: 'utm_campaign,utm_source,utm_medium',
				},
				{
					label: __( 'Source', 'jetpack-premium-analytics' ),
					value: 'utm_source',
				},
				{
					label: __( 'Medium', 'jetpack-premium-analytics' ),
					value: 'utm_medium',
				},
				{
					label: __( 'Campaign', 'jetpack-premium-analytics' ),
					value: 'utm_campaign',
				},
			],
			relevance: 'high',
		},
		{
			id: 'max',
			label: __( 'Max rows', 'jetpack-premium-analytics' ),
			type: 'number',
		},
	] as WidgetAttributeField< UtmInsightsAttributes >[],
	example: {
		attributes: {
			utmDimension: 'utm_source,utm_medium',
			max: 10,
		},
	},
};
