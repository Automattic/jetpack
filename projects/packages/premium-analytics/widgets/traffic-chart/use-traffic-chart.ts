/**
 * External dependencies
 */
import {
	localTZDate,
	useStatsVisits,
	type ReportParams,
	type StatsPeriod,
	type StatsVisitsParams,
	type StatsVisitsResponse,
	type StatsVisitsStatFields,
} from '@jetpack-premium-analytics/data';
import { useCallback, useMemo } from '@wordpress/element';
/**
 * Internal dependencies
 */
import {
	DEFAULT_TRAFFIC_CHART_METRICS,
	TRAFFIC_CHART_METRICS,
	type TrafficChartMetricId,
} from './widget';
import type { MetricTab } from '@jetpack-premium-analytics/widgets-toolkit';

/**
 * Granularity the chart can be grouped by. Layered onto the dashboard range as
 * its `period` (mapped to the visits endpoint's `unit`); the range and
 * comparison stay dashboard-driven.
 */
export type TrafficPeriod = Extract< StatsPeriod, 'day' | 'week' | 'month' >;

/**
 * Normalized traffic chart state: one metric tab per traffic field plus the
 * combined load/error flags across the two underlying requests.
 */
export interface TrafficChartState {
	metrics: MetricTab[];
	/** True while either request is fetching, including comparison refetches. */
	isFetching: boolean;
	isError: boolean;
	error: Error | null | undefined;
	refetch: () => void;
}

/**
 * Sum a single field across every period of a normalized visits report — the
 * period total the metric card shows as its headline.
 *
 * @param report - The normalized visits report, or undefined while loading.
 * @param field  - The metric field to total (views/visitors/likes/comments).
 * @return The period total, or 0 when the report is empty.
 */
function total( report: StatsVisitsResponse | undefined, field: string ): number {
	return Number( report?.summary?.[ field ] ?? 0 );
}

/**
 * Map a single field of a normalized visits report into chart points.
 *
 * @param report - The normalized visits report, or undefined while loading.
 * @param field  - The metric field to read from each period.
 * @return One point per period, oldest first.
 */
function toPoints( report: StatsVisitsResponse | undefined, field: string ) {
	return ( report?.data ?? [] ).map( point => ( {
		date: localTZDate( point.date_start ),
		value: Number( point[ field ] ?? 0 ),
	} ) );
}

/**
 * Build one metric tab from the request that carries its field. The headline is
 * the period total; the previous-period total and overlay are included only when
 * comparison is on *and* the comparison request actually returned rows — while
 * that request is still loading or came back empty, `total()` would be `0`, which
 * would render a misleading previous-period value.
 *
 * @param primary       - The current-period report for this field.
 * @param comparison    - The previous-period report, when comparison is on.
 * @param hasComparison - Whether the dashboard comparison is enabled.
 * @param field         - The metric field, also used as the tab key.
 * @param label         - The translated tab label.
 * @return The metric tab.
 */
function toMetric(
	primary: StatsVisitsResponse | undefined,
	comparison: StatsVisitsResponse | undefined,
	hasComparison: boolean,
	field: string,
	label: string
): MetricTab {
	const previous = hasComparison ? toPoints( comparison, field ) : undefined;
	const hasPrevious = !! previous?.length;
	return {
		key: field,
		label,
		value: total( primary, field ),
		previousValue: hasPrevious ? total( comparison, field ) : undefined,
		current: toPoints( primary, field ),
		previous: hasPrevious ? previous : undefined,
	};
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
	const needsViewsVisitors = selected.has( 'views' ) || selected.has( 'visitors' );
	const needsLikesComments = selected.has( 'likes' ) || selected.has( 'comments' );

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
	// the order the ids were toggled in.
	const metrics = useMemo(
		() =>
			TRAFFIC_CHART_METRICS.filter( metric => selected.has( metric.id ) ).map( metric => {
				const isViewsVisitors = metric.id === 'views' || metric.id === 'visitors';
				return toMetric(
					isViewsVisitors ? vvPrimary : lcPrimary,
					isViewsVisitors ? vvComparison : lcComparison,
					isViewsVisitors ? vvHasComparison : lcHasComparison,
					metric.id,
					metric.label
				);
			} ),
		[ selected, vvPrimary, vvComparison, vvHasComparison, lcPrimary, lcComparison, lcHasComparison ]
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

	return {
		metrics,
		isFetching: viewsVisitors.isFetching || likesComments.isFetching,
		isError: viewsVisitors.isError || likesComments.isError,
		error: viewsVisitors.error ?? likesComments.error,
		refetch,
	};
}
