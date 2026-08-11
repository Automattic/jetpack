/**
 * External dependencies
 */
import {
	useStatsVisits,
	type ReportParams,
	type StatsPeriod,
	type StatsVisitsParams,
	type StatsVisitsResponse,
	type StatsVisitsStatFields,
} from '@jetpack-premium-analytics/data';
import { useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { TRAFFIC_CHART_METRICS } from './widget';
import { buildMetricTab, type MetricTab } from '@jetpack-premium-analytics/widgets-toolkit';

/**
 * Bucket size the chart draws. Sent to the visits endpoint as its `unit`; which
 * one applies comes from the dashboard's interval control, along with the range
 * and comparison.
 */
export type TrafficPeriod = Extract< StatsPeriod, 'hour' | 'day' | 'week' | 'month' >;

type TrafficMetricId = ( typeof TRAFFIC_CHART_METRICS )[ number ][ 'id' ];

/**
 * The metrics `stats/visits` fills at the hourly grain. The rest come back
 * `null` there, so they are surfaced as unavailable rather than as zeroes, and
 * their request is skipped.
 */
const HOURLY_METRICS = new Set< TrafficMetricId >( [ 'views' ] );

/**
 * Normalized traffic chart state: one metric tab per traffic field plus the
 * combined load/error flags across the two underlying requests.
 */
export interface TrafficChartState {
	metrics: MetricTab[];
	/** True while either request's first load is in flight (no data yet). */
	isLoading: boolean;
	/** True while either request is fetching, including comparison refetches. */
	isFetching: boolean;
	isError: boolean;
	refetch: () => void;
}

function toVisitsParams(
	reportParams: ReportParams,
	statFields: StatsVisitsStatFields,
	period: TrafficPeriod
): StatsVisitsParams {
	return { ...reportParams, stat_fields: statFields, period };
}

/**
 * Fetch the traffic time series for the dashboard's report params. Views and
 * visitors ride one request, likes and comments a second — split (rather than a
 * single four-field request) because the visits endpoint's latency grows with
 * the number of requested fields, so two smaller requests resolve faster in
 * parallel. Mirrors how Calypso's chart tabs fetch each pair. The likes and
 * comments request is skipped entirely at the hourly grain, which cannot fill
 * either field.
 */
export default function useTrafficChart(
	reportParams: ReportParams,
	period: TrafficPeriod
): TrafficChartState {
	const isHourly = period === 'hour';
	const isServed = useCallback(
		( metricId: TrafficMetricId ) => ! isHourly || HOURLY_METRICS.has( metricId ),
		[ isHourly ]
	);

	// Memoize each request's params (as sibling Stats widgets do) so the query key
	// is stable across renders.
	const viewsVisitorsParams = useMemo(
		() => toVisitsParams( reportParams, isHourly ? 'views' : 'views,visitors', period ),
		[ reportParams, period, isHourly ]
	);
	const likesCommentsParams = useMemo(
		() => toVisitsParams( reportParams, 'likes,comments', period ),
		[ reportParams, period ]
	);

	const viewsVisitors = useStatsVisits( viewsVisitorsParams );
	const likesComments = useStatsVisits( likesCommentsParams, { enabled: ! isHourly } );

	const vvPrimary = viewsVisitors.primary.data as StatsVisitsResponse | undefined;
	const vvComparison = viewsVisitors.comparison.data as StatsVisitsResponse | undefined;
	const vvHasComparison = viewsVisitors.hasComparison;
	const lcPrimary = likesComments.primary.data as StatsVisitsResponse | undefined;
	const lcComparison = likesComments.comparison.data as StatsVisitsResponse | undefined;
	const lcHasComparison = likesComments.hasComparison;

	// One tab per metric, in canonical definition order.
	const metrics = useMemo(
		() =>
			TRAFFIC_CHART_METRICS.map( metric => {
				const isViewsVisitors = metric.id === 'views' || metric.id === 'visitors';
				return {
					...buildMetricTab( {
						primary: isViewsVisitors ? vvPrimary : lcPrimary,
						comparison: isViewsVisitors ? vvComparison : lcComparison,
						hasComparison: isViewsVisitors ? vvHasComparison : lcHasComparison,
						field: metric.id,
						label: metric.label,
					} ),
					...( isServed( metric.id )
						? {}
						: {
								unavailable: __(
									"Hourly data isn't available for this metric.",
									'jetpack-premium-analytics-pkg'
								),
						  } ),
				};
			} ),
		[ isServed, vvPrimary, vvComparison, vvHasComparison, lcPrimary, lcComparison, lcHasComparison ]
	);

	// Depend on the underlying refetch callbacks (each a stable `useReport`
	// `useCallback`), not the fresh result objects, so this stays stable across
	// renders.
	const { refetch: refetchViewsVisitors } = viewsVisitors;
	const { refetch: refetchLikesComments } = likesComments;
	const refetch = useCallback( () => {
		refetchViewsVisitors();
		refetchLikesComments();
	}, [ refetchViewsVisitors, refetchLikesComments ] );

	// Gate the error per query — the two independent queries back separate tabs, so
	// one failing on first load must surface an error rather than render as empty
	// tabs beside the other's populated chart. `placeholderData` keeps a query's
	// prior rows on a transient refetch failure, so a query with rows is not errored.
	const isError =
		( viewsVisitors.isError && ! vvPrimary?.data?.length ) ||
		( likesComments.isError && ! lcPrimary?.data?.length );

	return {
		metrics,
		isLoading: viewsVisitors.isLoading || likesComments.isLoading,
		isFetching: viewsVisitors.isFetching || likesComments.isFetching,
		isError,
		refetch,
	};
}
