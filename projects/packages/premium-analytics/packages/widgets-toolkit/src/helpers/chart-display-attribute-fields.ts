/**
 * External dependencies
 */
import { chartLine } from '@jetpack-premium-analytics/icons';
import { __ } from '@wordpress/i18n';
import { chartBar } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import type { MetricTabsChartType } from '../components/metric-tabs-chart/metric-tabs-chart';
import type { ReactElement } from 'react';

/**
 * How a chart widget draws its series: what the chart type attribute writes and the chart reads.
 */
export type ChartDisplayChartType = MetricTabsChartType;

/**
 * The chart types a widget offers as the `elements` of its `jpa/toggle-group` chart type
 * attribute, in segment order; one list keeps every widget's control identical.
 */
export const CHART_TYPE_ELEMENTS: {
	value: ChartDisplayChartType;
	label: string;
	icon: ReactElement;
}[] = [
	{ value: 'line', label: __( 'Line chart', 'jetpack-premium-analytics-pkg' ), icon: chartLine },
	{ value: 'bar', label: __( 'Bar chart', 'jetpack-premium-analytics-pkg' ), icon: chartBar },
];
