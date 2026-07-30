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
import {
	DEFAULT_TRAFFIC_CHART_METRICS,
	TRAFFIC_CHART_METRICS,
	type TrafficChartMetricId,
} from './widget';
import { buildMetricTab, type MetricTab } from '@jetpack-premium-analytics/widgets-toolkit';

/**
 * Granularity the chart can be grouped by. Layered onto the dashboard range as
 * its `period` (mapped to the visits endpoint's `unit`); the range and
 * comparison stay dashboard-driven.
 */
export type TrafficPeriod = Extract< StatsPeriod, 'hour' | 'day' | 'week' | 'month' >;

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

/**
 * Compose the visits query params for one field pair: the dashboard report
 * params plus the `stat_fields` this request should fetch and the selected
 * bucket `period`.
 *
 * @param reportParams - The dashboard report params.
 * @param statFields   - The field pair to request.
 * @param period       - The selected bucket granularity.
 * @return The visits query params.
 */
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
 * parallel. Mirrors how Calypso's chart tabs fetch each pair. A pair's request
 * is skipped entirely while neither of its fields is selected.
 *
 * @param reportParams - The dashboard date range + comparison state.
 * @param period       - The selected bucket granularity (day/week/month).
 * @param metricIds    - Selected metric tab ids; defaults to every metric.
 * @return The selected metric tabs and combined load/error state.
 */
export default function useTrafficChart(
	reportParams: ReportParams,
	period: TrafficPeriod,
	metricIds: TrafficChartMetricId[] = DEFAULT_TRAFFIC_CHART_METRICS
): TrafficChartState {
	const selected = useMemo( () => new Set( metricIds ), [ metricIds ] );
	// The hourly bucket only returns real numbers for `views` (visitors/likes/comments come
	// back null per row), so skip a request entirely when it would only serve disabled
	// metrics — fetching it anyway would waste a call and let a transient failure surface
	// as the widget's error state instead of the metrics' own disabled placeholder.
	const isHourly = period === 'hour';
	const needsViewsVisitors =
		selected.has( 'views' ) || ( selected.has( 'visitors' ) && ! isHourly );
	const needsLikesComments =
		! isHourly && ( selected.has( 'likes' ) || selected.has( 'comments' ) );

	// Memoize each request's params (as sibling Stats widgets do) so the query key
	// is stable across renders.
	const viewsVisitorsParams = useMemo(
		() => toVisitsParams( reportParams, 'views,visitors', period ),
		[ reportParams, period ]
	);
	const likesCommentsParams = useMemo(
		() => toVisitsParams( reportParams, 'likes,comments', period ),
		[ reportParams, period ]
	);

	const viewsVisitors = useStatsVisits( viewsVisitorsParams, { enabled: needsViewsVisitors } );
	const likesComments = useStatsVisits( likesCommentsParams, { enabled: needsLikesComments } );

	const vvPrimary = viewsVisitors.primary.data as StatsVisitsResponse | undefined;
	const vvComparison = viewsVisitors.comparison.data as StatsVisitsResponse | undefined;
	const vvHasComparison = viewsVisitors.hasComparison;
	const lcPrimary = likesComments.primary.data as StatsVisitsResponse | undefined;
	const lcComparison = likesComments.comparison.data as StatsVisitsResponse | undefined;
	const lcHasComparison = likesComments.hasComparison;

	// One tab per selected metric, in canonical definition order regardless of
	// the order the ids were toggled in. Hourly only has real data for `views`;
	// the other tabs stay visible but disabled with an explanatory tooltip
	// rather than rendering their (guaranteed-null) values as a misleading 0.
	const metrics = useMemo(
		() =>
			TRAFFIC_CHART_METRICS.filter( metric => selected.has( metric.id ) ).map( metric => {
				const isViewsVisitors = metric.id === 'views' || metric.id === 'visitors';
				const built = buildMetricTab( {
					primary: isViewsVisitors ? vvPrimary : lcPrimary,
					comparison: isViewsVisitors ? vvComparison : lcComparison,
					hasComparison: isViewsVisitors ? vvHasComparison : lcHasComparison,
					field: metric.id,
					label: metric.label,
				} );

				if ( isHourly && metric.id !== 'views' ) {
					return {
						...built,
						disabled: true,
						description: __(
							"Hourly data isn't available for this metric.",
							'jetpack-premium-analytics-pkg'
						),
					};
				}

				return built;
			} ),
		[
			selected,
			isHourly,
			vvPrimary,
			vvComparison,
			vvHasComparison,
			lcPrimary,
			lcComparison,
			lcHasComparison,
		]
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
