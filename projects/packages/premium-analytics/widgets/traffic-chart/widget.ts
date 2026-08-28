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
 * Metric tabs in display order; id doubles as the `stat_fields` value. Views
 * and Visitors pair via `counterpartId` (unavailable at the hourly bucket);
 * `counterpartId` is typed to the id set so a typo can't silently drop the pairing.
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
 * Configurable attributes for the Traffic chart widget; report params still
 * reach it through WidgetRoot or `attributes.reportParams` from a host.
 *
 * @property chartType - How to draw the selected metric. Defaults to `line`.
 */
export type TrafficChartAttributes = {
	chartType?: TrafficChartType;
};

/**
 * Ported from the Jetpack Stats `stats-chart-tabs` card in wp-calypso. Date
 * range, comparison, and bucket size come from `reportParams`; the plotted
 * metric is the chart's own tab selection, not an attribute.
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
