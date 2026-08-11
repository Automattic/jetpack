/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { people } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * Internal dependencies
 */
import { SelectField } from '@jetpack-premium-analytics/fields';
import type { MetricTabsChartType } from '@jetpack-premium-analytics/widgets-toolkit';

/**
 * Granularity the chart can be grouped by. `auto` follows the dashboard date
 * range (a wide range buckets by month, a narrow one by day); an explicit
 * value sticks across range changes.
 */
export type SubscribersChartGranularity = 'auto' | 'day' | 'week' | 'month';

/**
 * The chart types the widget offers, in display order. Single source for the
 * settings dropdown and the `SubscribersChartType` union so the two cannot
 * drift apart. Matches the Traffic summary chart's own switch, so the two
 * summary charts on the dashboard offer the same choice.
 */
export const SUBSCRIBERS_CHART_TYPES = [
	{ id: 'line', label: __( 'Line chart', 'jetpack-premium-analytics-pkg' ) },
	{ id: 'bar', label: __( 'Bar chart', 'jetpack-premium-analytics-pkg' ) },
] as const satisfies readonly { id: MetricTabsChartType; label: string }[];

/**
 * How the selected metric is drawn. Derived from the list above, which
 * `satisfies` the toolkit's own union, so a value the chart cannot draw fails
 * to compile here rather than shipping as a broken dropdown option.
 */
export type SubscribersChartType = ( typeof SUBSCRIBERS_CHART_TYPES )[ number ][ 'id' ];

/**
 * The metric tabs the chart can show, in display order: the persisted id and
 * label of each metric. The Paid subscribers tab only renders when the site
 * has paid subscribers.
 */
export const SUBSCRIBERS_CHART_METRICS = [
	{ id: 'subscribers', label: __( 'Subscribers', 'jetpack-premium-analytics-pkg' ) },
	{ id: 'paid', label: __( 'Paid subscribers', 'jetpack-premium-analytics-pkg' ) },
] as const satisfies readonly { id: string; label: string }[];

/**
 * Identifier of one metric tab.
 */
export type SubscribersChartMetricId = ( typeof SUBSCRIBERS_CHART_METRICS )[ number ][ 'id' ];

/**
 * Configurable attributes for the Subscribers chart widget. Report params
 * still reach it through WidgetRoot: the dashboard date range, or
 * `attributes.reportParams` when a host injects them (e.g. Storybook and
 * dashboard previews).
 *
 * @property granularity - Bucket size within the dashboard range. Defaults to `auto`.
 * @property chartType   - How to draw the selected metric. Defaults to `line`.
 */
export type SubscribersChartAttributes = {
	granularity?: SubscribersChartGranularity;
	chartType?: SubscribersChartType;
};

/**
 * Widget type definition.
 *
 * Ported from the Jetpack Stats `stats-subscribers-chart-section` card in
 * wp-calypso. The date range and previous-period comparison follow the
 * dashboard picker; the legacy interval segmented control is the
 * `granularity` attribute (`relevance: 'high'`), so the widget host renders
 * its control. It only chooses the bucket size within that range. Which metric
 * is plotted is the chart's own tab selection, not an attribute;
 * `example.attributes` doubles as the defaults applied to new instances.
 */
export default {
	icon: people,
	attributes: [
		{
			id: 'granularity',
			label: __( 'Group by', 'jetpack-premium-analytics-pkg' ),
			type: 'text',
			Edit: SelectField,
			elements: [
				{
					label: __( 'Auto', 'jetpack-premium-analytics-pkg' ),
					value: 'auto',
				},
				{
					label: __( 'By days', 'jetpack-premium-analytics-pkg' ),
					value: 'day',
				},
				{
					label: __( 'By weeks', 'jetpack-premium-analytics-pkg' ),
					value: 'week',
				},
				{
					label: __( 'By months', 'jetpack-premium-analytics-pkg' ),
					value: 'month',
				},
			],
			relevance: 'high',
		},
		{
			id: 'chartType',
			label: __( 'Chart type', 'jetpack-premium-analytics-pkg' ),
			type: 'text',
			Edit: SelectField,
			elements: SUBSCRIBERS_CHART_TYPES.map( chartType => ( {
				value: chartType.id,
				label: chartType.label,
			} ) ),
			relevance: 'high',
		},
	] as WidgetAttributeField< SubscribersChartAttributes >[],
	example: {
		attributes: {
			granularity: 'auto',
			chartType: 'line',
		},
	},
};
