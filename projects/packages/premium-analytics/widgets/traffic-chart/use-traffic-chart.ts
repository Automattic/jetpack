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
import { localTZDate } from '@jetpack-premium-analytics/datetime';
import { useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { endOfDay, isEqual, startOfDay } from 'date-fns';
/**
 * Internal dependencies
 */
import { buildTrafficTooltipExtras } from './tooltip-extras';
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
 * `null` there, so their chart is surfaced as unavailable rather than as zeroes.
 */
const HOURLY_METRICS = new Set< TrafficChartMetricId >( [ 'views' ] );

/**
 * Whether a range starts and ends on day boundaries, so daily buckets add up to
 * exactly the range. A rolling window such as "Last 24 hours" does not.
 *
 * @param reportParams - The dashboard range.
 * @return Whether the range covers whole days.
 */
function coversWholeDays( reportParams: ReportParams ): boolean {
	const from = localTZDate( reportParams.from );
	const to = localTZDate( reportParams.to );

	return isEqual( from, startOfDay( from ) ) && isEqual( to, endOfDay( to ) );
}

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
 *
 * At the hourly grain the second request asks for daily buckets instead, so the
 * cards still show the totals the hourly series cannot carry, as Calypso does.
 */
export default function useTrafficChart(
	reportParams: ReportParams,
	period: TrafficPeriod
): TrafficChartState {
	const isHourly = period === 'hour';
	const hasDailyTotals = isHourly && coversWholeDays( reportParams );
	const isServed = useCallback(
		( metricId: TrafficChartMetricId ) => ! isHourly || HOURLY_METRICS.has( metricId ),
		[ isHourly ]
	);

	// Memoize each request's params (as sibling Stats widgets do) so the query key
	// is stable across renders. `post_titles` feeds the tooltip's posts-published
	// row; the hourly report has none to give, so it is not asked for it.
	const viewsVisitorsParams = useMemo(
		() => toVisitsParams( reportParams, isHourly ? 'views' : 'views,visitors,post_titles', period ),
		[ reportParams, period, isHourly ]
	);
	const likesCommentsParams = useMemo(
		() =>
			isHourly
				? toVisitsParams( reportParams, 'visitors,likes,comments', 'day' )
				: toVisitsParams( reportParams, 'likes,comments', period ),
		[ reportParams, period, isHourly ]
	);

	const viewsVisitors = useStatsVisits( viewsVisitorsParams );
	const likesComments = useStatsVisits( likesCommentsParams, {
		enabled: ! isHourly || hasDailyTotals,
	} );

	const vvPrimary = viewsVisitors.primary.data as StatsVisitsResponse | undefined;
	const vvComparison = viewsVisitors.comparison.data as StatsVisitsResponse | undefined;
	const vvHasComparison = viewsVisitors.hasComparison;
	const vvZone = viewsVisitors.timezone;
	const lcPrimary = likesComments.primary.data as StatsVisitsResponse | undefined;
	const lcComparison = likesComments.comparison.data as StatsVisitsResponse | undefined;
	const lcHasComparison = likesComments.hasComparison;
	const lcZone = likesComments.timezone;

	// Gate the error per query so a failed one surfaces beside the other's populated
	// tabs instead of rendering empty; placeholder data spares a query that still has rows.
	const viewsVisitorsFailed = viewsVisitors.isError && ! vvPrimary?.data?.length;
	const likesCommentsFailed = likesComments.isError && ! lcPrimary?.data?.length;
	// The daily totals only fill cards, so losing them must not hide the hourly Views chart.
	const showsDailyTotals = hasDailyTotals && ! likesCommentsFailed;

	// Views per visitor and the posts published, read out under the Views and
	// Visitors tabs the way classic Stats does; the other tabs list their own metric only.
	const trafficTooltipExtras = useMemo(
		() => buildTrafficTooltipExtras( vvPrimary, vvZone ),
		[ vvPrimary, vvZone ]
	);

	// One tab per metric, in canonical definition order.
	const metrics = useMemo(
		() =>
			TRAFFIC_CHART_METRICS.map( metric => {
				// At the hourly grain visitors move to the daily request.
				const isFirst = metric.id === 'views' || ( metric.id === 'visitors' && ! isHourly );
				const readsTraffic = metric.id === 'views' || metric.id === 'visitors';
				const tab = {
					...buildMetricTab( {
						primary: isFirst ? vvPrimary : lcPrimary,
						comparison: isFirst ? vvComparison : lcComparison,
						hasComparison: isFirst ? vvHasComparison : lcHasComparison,
						field: metric.id,
						label: metric.label,
						countLabel: metric.countLabel,
						zone: isFirst ? vvZone : lcZone,
					} ),
					counterpartKey: 'counterpartId' in metric ? metric.counterpartId : undefined,
					counterpartHidden: 'counterpartHidden' in metric ? metric.counterpartHidden : undefined,
					tooltipExtras:
						readsTraffic && trafficTooltipExtras.length ? trafficTooltipExtras : undefined,
				};

				if ( isServed( metric.id ) ) {
					return tab;
				}

				const reason = __(
					"Hourly data isn't available for this metric.",
					'jetpack-premium-analytics-pkg'
				);

				// The daily buckets feed the card total only; drawn on the hourly axis
				// they would read as a single spike.
				return showsDailyTotals
					? { ...tab, current: [], previous: undefined, seriesUnavailable: reason }
					: { ...tab, unavailable: reason };
			} ),
		[
			isServed,
			isHourly,
			showsDailyTotals,
			trafficTooltipExtras,
			vvPrimary,
			vvComparison,
			vvHasComparison,
			vvZone,
			lcPrimary,
			lcComparison,
			lcHasComparison,
			lcZone,
		]
	);

	// Depend on the underlying refetch callbacks (stable `useReport` `useCallback`s),
	// not the fresh result objects, so this stays stable across renders.
	const { refetch: refetchViewsVisitors } = viewsVisitors;
	const { refetch: refetchLikesComments } = likesComments;
	const refetch = useCallback( () => {
		refetchViewsVisitors();
		refetchLikesComments();
	}, [ refetchViewsVisitors, refetchLikesComments ] );

	const isError = viewsVisitorsFailed || ( likesCommentsFailed && ! isHourly );

	return {
		metrics,
		isLoading: viewsVisitors.isLoading || likesComments.isLoading,
		isFetching: viewsVisitors.isFetching || likesComments.isFetching,
		isError,
		refetch,
	};
}
