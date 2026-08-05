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
import { SelectField } from '@jetpack-premium-analytics/fields';

/**
 * Widget attributes shape.
 *
 * @property utmDimension   - UTM dimension to break down by. Defaults to 'utm_source,utm_medium'.
 * @property max            - Maximum rows to display (0 = all). Defaults to 10.
 * @property showReportLink - Whether to render the "See report" footer link. Defaults to true.
 *                          Host compositions on terminal pages (post detail) set this to false;
 *                          it is not a user-facing control.
 */
export type UtmInsightsAttributes = {
	utmDimension?: StatsUtmParam;
	max?: number;
	showReportLink?: boolean;
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
	icon: trendingUp,
	attributes: [
		{
			id: 'utmDimension',
			label: __( 'UTM parameter', 'jetpack-premium-analytics-pkg' ),
			type: 'text',
			Edit: SelectField,
			elements: [
				{
					label: __( 'Source / Medium', 'jetpack-premium-analytics-pkg' ),
					value: 'utm_source,utm_medium',
				},
				{
					label: __( 'Campaign / Source / Medium', 'jetpack-premium-analytics-pkg' ),
					value: 'utm_campaign,utm_source,utm_medium',
				},
				{
					label: __( 'Source', 'jetpack-premium-analytics-pkg' ),
					value: 'utm_source',
				},
				{
					label: __( 'Medium', 'jetpack-premium-analytics-pkg' ),
					value: 'utm_medium',
				},
				{
					label: __( 'Campaign', 'jetpack-premium-analytics-pkg' ),
					value: 'utm_campaign',
				},
			],
			relevance: 'high',
		},
		{
			id: 'max',
			label: __( 'Number of results', 'jetpack-premium-analytics-pkg' ),
			type: 'integer',
		},
	] as WidgetAttributeField< UtmInsightsAttributes >[],
	example: {
		attributes: {
			utmDimension: 'utm_source,utm_medium',
			max: 10,
		},
	},
};
