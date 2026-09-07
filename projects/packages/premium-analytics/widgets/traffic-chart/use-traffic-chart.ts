/**
 * External dependencies
 */
import {
	useStatsVisits,
	type ReportParams,
	type StatsVisitsParams,
	type StatsVisitsResponse,
	type StatsVisitsStatFields,
} from '@jetpack-premium-analytics/data';
import { useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import {
	TRAFFIC_CHART_METRICS,
	type TrafficChartGranularity,
	type TrafficChartMetricId,
} from './widget';
import { buildMetricTab, type MetricTab } from '@jetpack-premium-analytics/widgets-toolkit';

/**
 * Bucket size the chart draws. Sent to the visits endpoint as its `unit`; which
 * one applies comes from the dashboard's interval control, along with the range
 * and comparison.
 */
export type TrafficPeriod = TrafficChartGranularity;

/**
 * The metrics `stats/visits` fills at the hourly grain. The rest come back
 * `null` there, so they are surfaced as unavailable rather than as zeroes, and
 * their request is skipped.
 */
const HOURLY_METRICS = new Set< TrafficChartMetricId >( [ 'views' ] );

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
 * Views/visitors and likes/comments ride separate requests — the visits
 * endpoint's latency grows with requested fields, so two smaller requests
 * resolve faster in parallel, mirroring Calypso's chart tabs.
 */
export default function useTrafficChart(
	reportParams: ReportParams,
	period: TrafficPeriod
): TrafficChartState {
	const isHourly = period === 'hour';
	const isServed = useCallback(
		( metricId: TrafficChartMetricId ) => ! isHourly || HOURLY_METRICS.has( metricId ),
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
					counterpartKey: 'counterpartId' in metric ? metric.counterpartId : undefined,
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

	// Depend on the underlying refetch callbacks (stable `useReport` `useCallback`s),
	// not the fresh result objects, so this stays stable across renders.
	const { refetch: refetchViewsVisitors } = viewsVisitors;
	const { refetch: refetchLikesComments } = likesComments;
	const refetch = useCallback( () => {
		refetchViewsVisitors();
		refetchLikesComments();
	}, [ refetchViewsVisitors, refetchLikesComments ] );

	// Gate the error per query so a failed one surfaces beside the other's populated
	// tabs instead of rendering empty; placeholder data spares a query that still has rows.
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
