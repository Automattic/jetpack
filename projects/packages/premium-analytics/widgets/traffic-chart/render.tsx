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
import { __ } from '@wordpress/i18n';
import { useCallback, useEffect, useRef } from 'react';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import useTrafficChart, { type TrafficPeriod } from './use-traffic-chart';
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

// Ordered finest to coarsest, as `defaultPeriodForInterval` requires.
const TRAFFIC_PERIODS = [
	'hour',
	'day',
	'week',
	'month',
] as const satisfies readonly TrafficPeriod[];

type TrafficChartInnerProps = {
	/**
	 * Bucket size to draw, as stored on the widget. Absent on a new instance,
	 * where the page's interval supplies it.
	 */
	granularity?: TrafficChartGranularity;
	/**
	 * How to draw the selected metric. `MetricTabsChart` owns the default.
	 */
	chartType?: TrafficChartType;
	/**
	 * Host setter, used to realign `granularity` when the page interval moves.
	 */
	setGranularity?: ( granularity: TrafficChartGranularity ) => void;
};

/**
 * "Group by" and "Chart type" are both `relevance: 'high'` attributes, so the
 * host renders them in the widget's header.
 *
 * The bucket is the page's decision until a reader overrides it here, and it
 * goes back to being the page's the moment the page interval moves again — so
 * the stored value can never outlive the interval it was chosen under, and a
 * reader looking at one widget by weeks does not stay stuck there after moving
 * the whole page. Which metric is plotted is the chart's own tab selection.
 */
function TrafficChartInner( { granularity, chartType, setGranularity }: TrafficChartInnerProps ) {
	const { reportParams } = useWidgetRootContext();
	const pagePeriod: TrafficPeriod = defaultPeriodForInterval(
		reportParams.interval,
		TRAFFIC_PERIODS
	);

	const previousPagePeriod = useRef( pagePeriod );
	const pageMoved = previousPagePeriod.current !== pagePeriod;

	// A layout saved before this widget offered hourly can still carry `auto`,
	// which is no longer one of the buckets and would otherwise reach the request.
	const stored =
		granularity && ( TRAFFIC_PERIODS as readonly string[] ).includes( granularity )
			? granularity
			: undefined;

	// Read the new bucket on the same render the page moved, rather than waiting
	// for the effect below to write it back — otherwise the requests go out for
	// the outgoing bucket first and are thrown away.
	const period: TrafficPeriod = pageMoved ? pagePeriod : stored ?? pagePeriod;

	// Store whatever is in force, so the header control names the bucket the chart
	// drew. Without an `Auto` option an unset attribute would leave the host's
	// select showing the first bucket on the list over a chart drawing another.
	useEffect( () => {
		previousPagePeriod.current = pagePeriod;

		if ( period !== granularity ) {
			setGranularity?.( period );
		}
	}, [ pagePeriod, period, granularity, setGranularity ] );

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

export default function TrafficChart( {
	attributes = {},
	setAttributes,
	setError,
}: TrafficChartWidgetProps ) {
	const setGranularity = useCallback(
		( granularity: TrafficChartGranularity ) => setAttributes?.( { granularity } ),
		[ setAttributes ]
	);

	return (
		<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
			<TrafficChartInner
				granularity={ attributes.granularity }
				chartType={ attributes.chartType }
				setGranularity={ setAttributes ? setGranularity : undefined }
			/>
		</WidgetRoot>
	);
}
