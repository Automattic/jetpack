/**
 * External dependencies
 */
import {
	MetricTabsChart,
	MetricTabsChartSkeleton,
	WidgetRoot,
	WidgetState,
	useWidgetRootContext,
	defaultPeriodForInterval,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { reports } from '@jetpack-premium-analytics/icons';
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
 * The bucket size follows the dashboard's chart interval control, clamped to
 * what this chart supports. The "Chart type" control is the `chartType`
 * attribute (`relevance: 'high'`), rendered by the widget host. Which metric is
 * plotted is the chart's own tab selection.
 */
function TrafficChartInner( { chartType }: TrafficChartInnerProps ) {
	const { reportParams } = useWidgetRootContext();
	const period: TrafficChartGranularity = defaultPeriodForInterval(
		reportParams.interval,
		TRAFFIC_PERIODS
	);

	// Bound to whichever route hosts the widget, the same way `reportParams` are.
	const { drillDown } = useReportDateFilters();

	// Names the bucket size drawn, not the page interval: a quarter or year page
	// interval clamps to months here, and the click must open the bar it hit.
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
	// A metric the endpoint can't serve at this bucket size carries its own
	// explanation, so it must not count towards emptiness and let the empty state
	// hide that explanation.
	const servedMetrics = metricTabs.filter( metric => ! metric.unavailable );

	return (
		<div className={ styles.root }>
			<WidgetState
				isLoading={ isLoading }
				isFetching={ isFetching }
				// `useTrafficChart` already gates `isError` per query on that query
				// having no rows, so a transient refetch failure keeps the chart.
				isError={ isError }
				// `[].every()` is true, so the length test is what keeps a chart whose
				// every metric is unavailable out of the empty state, which would
				// replace those explanations with "no data".
				isEmpty={
					servedMetrics.length > 0 && servedMetrics.every( metric => metric.current.length === 0 )
				}
				error={ {
					description: __(
						"We couldn't load traffic data. Please try again in a moment.",
						'jetpack-premium-analytics-pkg'
					),
					actions: [ { label: __( 'Retry', 'jetpack-premium-analytics-pkg' ), onClick: refetch } ],
				} }
				empty={ {
					icon: reports,
					description: __( 'No traffic data in this period.', 'jetpack-premium-analytics-pkg' ),
				} }
				renderLoading={ <MetricTabsChartSkeleton /> }
			>
				<MetricTabsChart
					metrics={ metricTabs }
					dataFormat={ DATA_FORMAT }
					chartType={ chartType }
					groupLabel={ groupLabel }
					tickResolution={ period }
					pointsAreWallClocks
					onDatumClick={ openBucket }
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
