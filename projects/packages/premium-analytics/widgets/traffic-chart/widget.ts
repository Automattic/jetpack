/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import type { StatsPeriod } from '@jetpack-premium-analytics/data';
import { trendingUp } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * Internal dependencies
 */
import {
	chartTypeAttributeField,
	type ChartDisplayChartType,
} from '@jetpack-premium-analytics/widgets-toolkit';

/**
 * The bucket sizes this chart draws, ordered finest to coarsest as
 * `defaultPeriodForInterval` requires. The bucket follows the dashboard's
 * interval control, clamped into this set.
 */
export const TRAFFIC_PERIODS = [
	'hour',
	'day',
	'week',
	'month',
] as const satisfies readonly StatsPeriod[];

export type TrafficChartGranularity = ( typeof TRAFFIC_PERIODS )[ number ];

/**
 * How the selected metric is drawn. The shared chart-display list keeps every
 * chart widget's dropdown identical and ties it to the toolkit's own union.
 */
export type TrafficChartType = ChartDisplayChartType;

/** The visits `stat_fields` field each metric tab reads, which is also its id. */
export type TrafficChartMetricId = 'views' | 'visitors' | 'comments' | 'likes';

/**
 * The metric tabs the chart shows, in display order: the id and label of each
 * metric. The id doubles as the visits `stat_fields` field the tab reads.
 *
 * Views and Visitors name each other as `counterpartId`, so whichever of the
 * two is selected draws the other alongside it, hidden until the reader reveals
 * it from the legend — except at the hourly bucket, where Visitors is
 * unavailable and Views stands alone. Comments and Likes answer different
 * questions from each other and stand alone.
 *
 * `counterpartId` is constrained to the ids above rather than to `string`: a
 * key naming no metric is ignored in silence, so a typo would simply drop the
 * pairing with nothing to notice.
 */
export const TRAFFIC_CHART_METRICS = [
	{ id: 'views', label: __( 'Views', 'jetpack-premium-analytics-pkg' ), counterpartId: 'visitors' },
	{
		id: 'visitors',
		label: __( 'Visitors', 'jetpack-premium-analytics-pkg' ),
		counterpartId: 'views',
	},
	{ id: 'comments', label: __( 'Comments', 'jetpack-premium-analytics-pkg' ) },
	{ id: 'likes', label: __( 'Likes', 'jetpack-premium-analytics-pkg' ) },
] as const satisfies readonly {
	id: TrafficChartMetricId;
	label: string;
	counterpartId?: TrafficChartMetricId;
}[];

/**
 * Configurable attributes for the Traffic chart widget. Report params still
 * reach it through WidgetRoot: the dashboard date range, or
 * `attributes.reportParams` when a host injects them (e.g. Storybook and
 * dashboard previews).
 *
 * @property chartType - How to draw the selected metric. Defaults to `line`.
 */
export type TrafficChartAttributes = {
	chartType?: TrafficChartType;
};

/**
 * Widget type definition.
 *
 * Ported from the Jetpack Stats `stats-chart-tabs` card in wp-calypso (the chart
 * above the Traffic page). Renders the selected period's Views, Visitors,
 * Comments, and Likes as selectable metric tabs over a comparative chart. The
 * date range, comparison state, and bucket size come from the dashboard via
 * `reportParams`; `chartType` switches between lines and bars. Which metric is
 * plotted is the chart's own tab selection, not an attribute.
 * `example.attributes` doubles as the defaults applied to new instances.
 */
export default {
	icon: trendingUp,
	attributes: [ chartTypeAttributeField() ] as WidgetAttributeField< TrafficChartAttributes >[],
	example: {
		attributes: {
			chartType: 'line',
		},
	},
};
