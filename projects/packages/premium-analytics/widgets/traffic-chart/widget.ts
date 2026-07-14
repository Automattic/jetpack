/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { chartBar } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * Internal dependencies
 */
import { ArrayCheckboxField } from '@jetpack-premium-analytics/fields';

/**
 * Granularity the chart can be grouped by. `auto` follows the dashboard date
 * range (a wide range buckets by month, a narrow one by day); an explicit
 * value sticks across range changes.
 */
export type TrafficChartGranularity = 'auto' | 'day' | 'week' | 'month';

/**
 * The metric tabs the chart can show, in display order: the persisted id and
 * label of each metric. The id doubles as the visits `stat_fields` field the
 * tab reads. Single source for the settings checkboxes and the chart tabs so
 * the two cannot drift apart.
 */
export const TRAFFIC_CHART_METRICS = [
	{ id: 'views', label: __( 'Views', 'jetpack-premium-analytics' ) },
	{ id: 'visitors', label: __( 'Visitors', 'jetpack-premium-analytics' ) },
	{ id: 'likes', label: __( 'Likes', 'jetpack-premium-analytics' ) },
	{ id: 'comments', label: __( 'Comments', 'jetpack-premium-analytics' ) },
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
 */
export type TrafficChartAttributes = {
	granularity?: TrafficChartGranularity;
	metrics?: TrafficChartMetricId[];
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
 * and Comments as selectable metric tabs over a comparative line chart. The date
 * range and comparison state come from the dashboard via `reportParams`; the
 * `granularity` attribute (`relevance: 'high'`) chooses the bucket size within
 * that range and the `metrics` attribute selects which tabs render.
 * `example.attributes` doubles as the defaults applied to new instances.
 */
export default {
	name: 'jpa/traffic-chart',
	title: __( 'Traffic', 'jetpack-premium-analytics' ),
	help: {
		content: __(
			'Compare views, visitors, likes, and comments over the selected period, with the previous period overlaid for comparison.',
			'jetpack-premium-analytics'
		),
	},
	icon: chartBar,
	attributes: [
		{
			id: 'granularity',
			label: __( 'Group by', 'jetpack-premium-analytics' ),
			type: 'text',
			elements: [
				{
					label: __( 'Auto', 'jetpack-premium-analytics' ),
					value: 'auto',
				},
				{
					label: __( 'By days', 'jetpack-premium-analytics' ),
					value: 'day',
				},
				{
					label: __( 'By weeks', 'jetpack-premium-analytics' ),
					value: 'week',
				},
				{
					label: __( 'By months', 'jetpack-premium-analytics' ),
					value: 'month',
				},
			],
			relevance: 'high',
		},
		{
			id: 'metrics',
			label: __( 'Metrics', 'jetpack-premium-analytics' ),
			type: 'array',
			relevance: 'high',
			Edit: ArrayCheckboxField,
			elements: TRAFFIC_CHART_METRICS.map( metric => ( {
				value: metric.id,
				label: metric.label,
			} ) ),
		},
	] as WidgetAttributeField< TrafficChartAttributes >[],
	example: {
		attributes: {
			granularity: 'auto',
			metrics: DEFAULT_TRAFFIC_CHART_METRICS,
		},
	},
};
