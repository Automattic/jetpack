/**
 * External dependencies
 */
import {
	ChartEmptyState,
	MetricTabsChart,
	MetricTabsChartSkeleton,
	WidgetRoot,
	WidgetState,
	useWidgetRootContext,
	defaultPeriodForInterval,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { search } from '@jetpack-premium-analytics/icons';
import { useReportDateFilters } from '@jetpack-premium-analytics/routing';
import { __ } from '@wordpress/i18n';
import { useCallback } from 'react';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import useTrafficChart from './use-traffic-chart';
import { TRAFFIC_PERIODS } from './widget';
import type { TrafficChartAttributes, TrafficChartGranularity, TrafficChartType } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps } from 'react';

type TrafficChartRenderAttributes = TrafficChartAttributes & Partial< ReportParamsFieldAttributes >;
type TrafficChartWidgetProps = WidgetRenderProps< TrafficChartRenderAttributes > & {
	/**
	 * Host callback to surface a widget error in the dashboard frame.
	 */
	setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
};

const DATA_FORMAT = {
	type: 'number' as const,
	options: { useMultipliers: true, decimals: 0 },
};

type TrafficChartInnerProps = {
	/**
	 * How to draw the selected metric. `MetricTabsChart` owns the default.
	 */
	chartType?: TrafficChartType;
};

/**
 * The bucket size follows the dashboard's chart interval control, clamped to what
 * this chart supports; which metric is plotted is the chart's own tab selection.
 */
function TrafficChartInner( { chartType }: TrafficChartInnerProps ) {
	const { reportParams } = useWidgetRootContext();
	const period: TrafficChartGranularity = defaultPeriodForInterval(
		reportParams.interval,
		TRAFFIC_PERIODS
	);

	// Bound to whichever route hosts the widget, the same way `reportParams` are.
	const { drillDown } = useReportDateFilters();

	// Names the bucket size drawn, not the page interval: a year page interval
	// clamps to months here, and the click must open the bar it hit.
	const openBucket = useCallback(
		( date: Date ) => drillDown( date, period ),
		[ drillDown, period ]
	);

	const {
		metrics: metricTabs,
		isLoading,
		isFetching,
		isError,
		refetch,
	} = useTrafficChart( reportParams, period );
	const groupLabel = __( 'Traffic metric', 'jetpack-premium-analytics-pkg' );

	return (
		<div className={ styles.root }>
			<WidgetState
				isLoading={ isLoading }
				isFetching={ isFetching }
				// `useTrafficChart` already gates `isError` per query on that query
				// having no rows, so a transient refetch failure keeps the chart.
				isError={ isError }
				// `stats/visits` zero-fills every bucket of an idle window, so emptiness is judged per metric inside the chart, where the tabs keep showing their zeros.
				isEmpty={ false }
				error={ {
					description: __(
						"We couldn't load traffic data. Please try again in a moment.",
						'jetpack-premium-analytics-pkg'
					),
					actions: [ { label: __( 'Retry', 'jetpack-premium-analytics-pkg' ), onClick: refetch } ],
				} }
				renderLoading={ <MetricTabsChartSkeleton /> }
			>
				<MetricTabsChart
					metrics={ metricTabs }
					dataFormat={ DATA_FORMAT }
					chartType={ chartType }
					groupLabel={ groupLabel }
					tickResolution={ period }
					onDatumClick={ openBucket }
					empty={
						<ChartEmptyState
							icon={ search }
							text={ __(
								'We couldn’t find results for this time period.',
								'jetpack-premium-analytics-pkg'
							) }
						/>
					}
				/>
			</WidgetState>
		</div>
	);
}

export default function TrafficChart( { attributes = {}, setError }: TrafficChartWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
			<TrafficChartInner chartType={ attributes.chartType } />
		</WidgetRoot>
	);
}
