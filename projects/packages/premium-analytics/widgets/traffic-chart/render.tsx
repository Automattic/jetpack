/**
 * External dependencies
 */
import {
	MetricTabsChart,
	MetricTabsChartSkeleton,
	WidgetRoot,
	WidgetState,
	useWidgetRootContext,
	followedGranularity,
	granularitiesForRange,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { reports } from '@jetpack-premium-analytics/icons';
import { __ } from '@wordpress/i18n';
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
	 * Bucket a reader picked, if any. Absent until one is.
	 */
	granularity?: TrafficChartGranularity;
	/**
	 * The page bucket that pick was made against; it stops applying once the page
	 * resolves to another.
	 */
	granularityPickedFor?: TrafficChartGranularity;
	/**
	 * How to draw the selected metric. `MetricTabsChart` owns the default.
	 */
	chartType?: TrafficChartType;
};

/**
 * "Group by" and "Chart type" are both `relevance: 'high'` attributes, so the
 * host renders them in the widget's header.
 *
 * The bucket is the page's decision until a reader overrides it here, and it
 * goes back to being the page's the moment the page interval moves again — a
 * reader looking at one widget by weeks does not stay stuck there after moving
 * the whole page. Nothing is written back for that: a pick records the page
 * bucket it was made against and simply stops applying, which is also what keeps
 * this and the header control from ever naming different buckets. Which metric
 * is plotted is the chart's own tab selection.
 */
function TrafficChartInner( {
	granularity,
	granularityPickedFor,
	chartType,
}: TrafficChartInnerProps ) {
	const { reportParams } = useWidgetRootContext();
	// The range narrows what this chart draws, not just what the control offers:
	// judging the pick against the same set is what makes one that the range no
	// longer supports lapse instead of outliving the range it was made for.
	const period = followedGranularity( {
		picked: granularity,
		pickedFor: granularityPickedFor,
		interval: reportParams.interval,
		allowed: granularitiesForRange( TRAFFIC_PERIODS, reportParams ),
	} );

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
				/>
			</WidgetState>
		</div>
	);
}

export default function TrafficChart( { attributes = {}, setError }: TrafficChartWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
			<TrafficChartInner
				granularity={ attributes.granularity }
				granularityPickedFor={ attributes.granularityPickedFor }
				chartType={ attributes.chartType }
			/>
		</WidgetRoot>
	);
}
