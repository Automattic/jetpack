/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import type { MetricTabsChartType } from '../components/metric-tabs-chart/metric-tabs-chart';

/**
 * How a chart widget draws its series: what the chart type attribute writes and the chart reads.
 */
export type ChartDisplayChartType = MetricTabsChartType;

/**
 * The chart types a widget offers as the `elements` of its `jpa/toggle-group` chart type
 * attribute, in segment order, icons as `jpa/<name>` references the control resolves; one
 * list keeps every widget's control identical.
 */
export const CHART_TYPE_ELEMENTS: {
	value: ChartDisplayChartType;
	label: string;
	icon: string;
}[] = [
	{
		value: 'line',
		label: __( 'Line chart', 'jetpack-premium-analytics-pkg' ),
		icon: 'jpa/chart-line',
	},
	{
		value: 'bar',
		label: __( 'Bar chart', 'jetpack-premium-analytics-pkg' ),
		icon: 'jpa/chart-bar',
	},
];
