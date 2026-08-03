/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { trendingUp } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * Internal dependencies
 */
import { ArrayCheckboxField, SelectField } from '@jetpack-premium-analytics/fields';

/**
 * Granularity the chart can be grouped by. `auto` follows the dashboard date
 * range (a wide range buckets by month, a narrow one by day); an explicit
 * value sticks across range changes.
 */
export type SubscribersChartGranularity = 'auto' | 'day' | 'week' | 'month';

/**
 * The metric tabs the chart can show, in display order: the persisted id and
 * label of each metric. Single source for the settings checkboxes and the
 * chart tabs so the two cannot drift apart. The Paid subscribers tab only
 * renders when the site has paid subscribers, even while selected.
 */
export const SUBSCRIBERS_CHART_METRICS = [
	{ id: 'subscribers', label: __( 'Subscribers', 'jetpack-premium-analytics-pkg' ) },
	{ id: 'paid', label: __( 'Paid subscribers', 'jetpack-premium-analytics-pkg' ) },
] as const satisfies readonly { id: string; label: string }[];

/**
 * Identifier persisted in the widget's `metrics` attribute for one metric tab.
 */
export type SubscribersChartMetricId = ( typeof SUBSCRIBERS_CHART_METRICS )[ number ][ 'id' ];

/**
 * Configurable attributes for the Subscribers chart widget. Report params
 * still reach it through WidgetRoot: the dashboard date range, or
 * `attributes.reportParams` when a host injects them (e.g. Storybook and
 * dashboard previews).
 *
 * @property granularity - Bucket size within the dashboard range. Defaults to `auto`.
 * @property metrics     - Metric tabs to show in the chart. Defaults to every metric.
 */
export type SubscribersChartAttributes = {
	granularity?: SubscribersChartGranularity;
	metrics?: SubscribersChartMetricId[];
};

/**
 * Default selection for new widget instances: every metric enabled.
 */
export const DEFAULT_SUBSCRIBERS_CHART_METRICS: SubscribersChartMetricId[] =
	SUBSCRIBERS_CHART_METRICS.map( metric => metric.id );

/**
 * Widget type definition.
 *
 * Ported from the Jetpack Stats `stats-subscribers-chart-section` card in
 * wp-calypso. The date range and previous-period comparison follow the
 * dashboard picker; the legacy interval segmented control is the
 * `granularity` attribute (`relevance: 'high'`), so the widget host renders
 * its control. It only chooses the bucket size within that range. The
 * `metrics` attribute selects which tabs render; `example.attributes` doubles
 * as the defaults applied to new instances.
 */
export default {
	icon: trendingUp,
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
			elements: SUBSCRIBERS_CHART_METRICS.map( metric => ( {
				value: metric.id,
				label: metric.label,
			} ) ),
		},
	] as WidgetAttributeField< SubscribersChartAttributes >[],
	example: {
		attributes: {
			granularity: 'auto',
			metrics: DEFAULT_SUBSCRIBERS_CHART_METRICS,
		},
	},
};
