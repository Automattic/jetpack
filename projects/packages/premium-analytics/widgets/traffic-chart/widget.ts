/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { chartBar } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * Internal dependencies
 */
import { ArrayCheckboxField, SelectField } from '@jetpack-premium-analytics/fields';
import type { MetricTabsChartType } from '@jetpack-premium-analytics/widgets-toolkit';

/**
 * Granularity the chart can be grouped by. `auto` follows the dashboard date
 * range (a wide range buckets by month, a narrow one by day); an explicit
 * value sticks across range changes.
 */
export type TrafficChartGranularity = 'auto' | 'day' | 'week' | 'month';

/**
 * The chart types the widget offers, in display order. Single source for the
 * settings dropdown and the `TrafficChartType` union so the two cannot drift
 * apart. Ported from the Lines/Bars switch on the Jetpack Stats chart tabs card
 * in wp-calypso.
 */
export const TRAFFIC_CHART_TYPES = [
	{ id: 'line', label: __( 'Line chart', 'jetpack-premium-analytics-pkg' ) },
	{ id: 'bar', label: __( 'Bar chart', 'jetpack-premium-analytics-pkg' ) },
] as const satisfies readonly { id: MetricTabsChartType; label: string }[];

/**
 * How the selected metric is drawn. Derived from the list above, which
 * `satisfies` the toolkit's own union, so a value the chart cannot draw fails
 * to compile here rather than shipping as a broken dropdown option.
 */
export type TrafficChartType = ( typeof TRAFFIC_CHART_TYPES )[ number ][ 'id' ];

/**
 * The metric tabs the chart can show, in display order: the persisted id and
 * label of each metric. The id doubles as the visits `stat_fields` field the
 * tab reads. Single source for the settings checkboxes and the chart tabs so
 * the two cannot drift apart.
 */
export const TRAFFIC_CHART_METRICS = [
	{ id: 'views', label: __( 'Views', 'jetpack-premium-analytics-pkg' ) },
	{ id: 'visitors', label: __( 'Visitors', 'jetpack-premium-analytics-pkg' ) },
	{ id: 'likes', label: __( 'Likes', 'jetpack-premium-analytics-pkg' ) },
	{ id: 'comments', label: __( 'Comments', 'jetpack-premium-analytics-pkg' ) },
] as const satisfies readonly { id: string; label: string }[];

/**
 * Identifier persisted in the widget's `metrics` attribute for one metric tab.
 */
export type TrafficChartMetricId = ( typeof TRAFFIC_CHART_METRICS )[ number ][ 'id' ];

/**
 * Configurable attributes for the Traffic chart widget. Report params still
 * reach it through WidgetRoot: the dashboard date range, or
 * `attributes.reportParams` when a host injects them (e.g. Storybook and
 * dashboard previews).
 *
 * @property granularity - Bucket size within the dashboard range. Defaults to `auto`.
 * @property metrics     - Metric tabs to show in the chart. Defaults to every metric.
 * @property chartType   - How to draw the selected metric. Defaults to `line`.
 */
export type TrafficChartAttributes = {
	granularity?: TrafficChartGranularity;
	metrics?: TrafficChartMetricId[];
	chartType?: TrafficChartType;
};

/**
 * Default selection for new widget instances: every metric enabled.
 */
export const DEFAULT_TRAFFIC_CHART_METRICS: TrafficChartMetricId[] = TRAFFIC_CHART_METRICS.map(
	metric => metric.id
);

/**
 * Widget type definition.
 *
 * Ported from the Jetpack Stats `stats-chart-tabs` card in wp-calypso (the chart
 * above the Traffic page). Renders the selected period's Views, Visitors, Likes,
 * and Comments as selectable metric tabs over a comparative chart. The date
 * range and comparison state come from the dashboard via `reportParams`; the
 * `granularity` attribute (`relevance: 'high'`) chooses the bucket size within
 * that range, the `metrics` attribute selects which tabs render, and
 * `chartType` switches between lines and bars.
 * `example.attributes` doubles as the defaults applied to new instances.
 */
export default {
	icon: chartBar,
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
			id: 'metrics',
			label: __( 'Metrics', 'jetpack-premium-analytics-pkg' ),
			type: 'array',
			relevance: 'high',
			Edit: ArrayCheckboxField,
			elements: TRAFFIC_CHART_METRICS.map( metric => ( {
				value: metric.id,
				label: metric.label,
			} ) ),
		},
		{
			id: 'chartType',
			label: __( 'Chart type', 'jetpack-premium-analytics-pkg' ),
			type: 'text',
			Edit: SelectField,
			elements: TRAFFIC_CHART_TYPES.map( chartType => ( {
				value: chartType.id,
				label: chartType.label,
			} ) ),
			relevance: 'high',
		},
	] as WidgetAttributeField< TrafficChartAttributes >[],
	example: {
		attributes: {
			granularity: 'auto',
			metrics: DEFAULT_TRAFFIC_CHART_METRICS,
			chartType: 'line',
		},
	},
};
