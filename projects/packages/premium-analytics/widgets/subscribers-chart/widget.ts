/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { people } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * Internal dependencies
 */
import {
	chartTypeAttributeField,
	granularityAttributeField,
	type ChartDisplayChartType,
} from '@jetpack-premium-analytics/widgets-toolkit';

/**
 * Granularity the chart can be grouped by. `auto` follows the dashboard date
 * range (a wide range buckets by month, a narrow one by day); an explicit
 * value sticks across range changes.
 */
export type SubscribersChartGranularity = 'auto' | 'day' | 'week' | 'month';

/**
 * How the selected metric is drawn. The shared chart-display list keeps every
 * chart widget's dropdown identical and ties it to the toolkit's own union.
 */
export type SubscribersChartType = ChartDisplayChartType;

/**
 * The metric tabs the chart shows, in display order: the id and label of each
 * metric. The Paid subscribers tab only renders when the site has paid
 * subscribers.
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
		granularityAttributeField( [ 'auto', 'day', 'week', 'month' ] ),
		chartTypeAttributeField(),
	] as WidgetAttributeField< SubscribersChartAttributes >[],
	example: {
		attributes: {
			granularity: 'auto',
			chartType: 'line',
		},
	},
};
