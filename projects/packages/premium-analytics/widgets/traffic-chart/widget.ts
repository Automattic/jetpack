/**
 * WordPress dependencies
 */
import { __, _n } from '@wordpress/i18n';
import type { StatsPeriod } from '@jetpack-premium-analytics/data';
import { trendingUp } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * Internal dependencies
 */
import {
	chartIntervalElements,
	chartIntervalField,
	type ChartIntervalFieldAttributes,
} from '@jetpack-premium-analytics/fields';
import {
	CHART_TYPE_ELEMENTS,
	type ChartDisplayChartType,
	type CountLabel,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { readStatsV1ChartType } from './stats-v1-chart-type';

/**
 * The bucket sizes this chart draws, offered by its own interval control.
 */
export const TRAFFIC_PERIODS = [
	'hour',
	'day',
	'week',
	'month',
] as const satisfies readonly StatsPeriod[];

/**
 * The chart type drawn when nothing is saved: the one Stats v1 saved in this browser, else bars.
 *
 * @return The default chart type.
 */
export function defaultChartType(): TrafficChartType {
	return readStatsV1ChartType() ?? 'bar';
}

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
 * Visitors starts with Views hidden, since Views' scale would flatten its line.
 */
export const TRAFFIC_CHART_METRICS = [
	{
		id: 'views',
		label: __( 'Views', 'jetpack-premium-analytics-pkg' ),
		countLabel: count =>
			/* translators: %s: number of views. */
			_n( '%s View', '%s Views', count, 'jetpack-premium-analytics-pkg' ),
		counterpartId: 'visitors',
	},
	{
		id: 'visitors',
		label: __( 'Visitors', 'jetpack-premium-analytics-pkg' ),
		countLabel: count =>
			/* translators: %s: number of visitors. */
			_n( '%s Visitor', '%s Visitors', count, 'jetpack-premium-analytics-pkg' ),
		counterpartId: 'views',
		counterpartHidden: true,
	},
	{
		id: 'comments',
		label: __( 'Comments', 'jetpack-premium-analytics-pkg' ),
		countLabel: count =>
			/* translators: %s: number of comments. */
			_n( '%s Comment', '%s Comments', count, 'jetpack-premium-analytics-pkg' ),
	},
	{
		id: 'likes',
		label: __( 'Likes', 'jetpack-premium-analytics-pkg' ),
		countLabel: count =>
			/* translators: %s: number of likes. */
			_n( '%s Like', '%s Likes', count, 'jetpack-premium-analytics-pkg' ),
	},
] as const satisfies readonly {
	id: TrafficChartMetricId;
	label: string;
	countLabel: CountLabel;
	counterpartId?: TrafficChartMetricId;
	counterpartHidden?: boolean;
}[];

/**
 * Configurable attributes for the Traffic chart widget; report params still
 * reach it through WidgetRoot or `attributes.reportParams` from a host.
 *
 * @property chartType     - How to draw the selected metric. Defaults to the Stats v1 choice, else `bar`.
 * @property chartInterval - The bucket size. Defaults to the one the date range suggests.
 */
export type TrafficChartAttributes = ChartIntervalFieldAttributes< TrafficChartGranularity > & {
	chartType?: TrafficChartType;
};

const chartIntervalAttribute = {
	...chartIntervalField,
	elements: chartIntervalElements( TRAFFIC_PERIODS ),
};

// The switch must show what the chart draws, and the default depends on Stats v1.
const chartTypeAttribute = {
	id: 'chartType',
	label: __( 'Chart type', 'jetpack-premium-analytics-pkg' ),
	type: 'jpa/toggle-group',
	elements: CHART_TYPE_ELEMENTS,
	relevance: 'high',
	getValue: ( { item }: { item: TrafficChartAttributes } ) => item.chartType ?? defaultChartType(),
};

/**
 * Ported from the Jetpack Stats `stats-chart-tabs` card in wp-calypso. Date
 * range and comparison come from `reportParams`; the plotted metric is the
 * chart's own tab selection, not an attribute.
 */
export default {
	icon: trendingUp,
	attributes: [
		chartIntervalAttribute,
		chartTypeAttribute,
	] as WidgetAttributeField< TrafficChartAttributes >[],
	example: {
		attributes: {},
	},
};
