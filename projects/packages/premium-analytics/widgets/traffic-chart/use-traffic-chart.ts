/**
 * External dependencies
 */
import {
	localTZDate,
	useStatsVisits,
	type ReportParams,
	type StatsVisitsParams,
	type StatsVisitsResponse,
	type StatsVisitsStatFields,
} from '@jetpack-premium-analytics/data';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import type { MetricTab } from '@jetpack-premium-analytics/widgets-toolkit';

/**
 * Normalized traffic chart state: one metric tab per traffic field plus the
 * combined load/error flags across the two underlying requests.
 */
export interface TrafficChartState {
	metrics: MetricTab[];
	/** True while either request is fetching, including comparison refetches. */
	isFetching: boolean;
	isError: boolean;
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
 * the dashboard comparison is on.
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
	return {
		key: field,
		label,
		value: total( primary, field ),
		previousValue: hasComparison ? total( comparison, field ) : undefined,
		current: toPoints( primary, field ),
		previous: hasComparison ? toPoints( comparison, field ) : undefined,
	};
}

/**
 * Compose the visits query params for one field pair. `StatsVisitsParams` folds
 * in `StatsQueryParams`' string index signature, which a plain `ReportParams`
 * spread (no index signature) can't satisfy structurally; the object is correct
 * at runtime, so the cast bridges that purely type-level gap.
 *
 * @param reportParams - The dashboard report params.
 * @param statFields   - The field pair to request.
 * @return The visits query params.
 */
function toVisitsParams(
	reportParams: ReportParams,
	statFields: StatsVisitsStatFields
): StatsVisitsParams {
	return { ...reportParams, stat_fields: statFields } as StatsVisitsParams;
}

/**
 * Fetch the traffic time series for the dashboard's report params. Views and
 * visitors ride one request, likes and comments a second — split (rather than a
 * single four-field request) because the visits endpoint's latency grows with
 * the number of requested fields, so two smaller requests resolve faster in
 * parallel. Mirrors how Calypso's chart tabs fetch each pair.
 *
 * @param reportParams - The dashboard date range + comparison state.
 * @return The metric tabs and combined load/error state.
 */
export default function useTrafficChart( reportParams: ReportParams ): TrafficChartState {
	// Memoize each request's params (as sibling Stats widgets do) so the query key
	// is stable across renders.
	const viewsVisitorsParams = useMemo(
		() => toVisitsParams( reportParams, 'views,visitors' ),
		[ reportParams ]
	);
	const likesCommentsParams = useMemo(
		() => toVisitsParams( reportParams, 'likes,comments' ),
		[ reportParams ]
	);

	const viewsVisitors = useStatsVisits( viewsVisitorsParams );
	const likesComments = useStatsVisits( likesCommentsParams );

	const vvPrimary = viewsVisitors.primary.data as StatsVisitsResponse | undefined;
	const vvComparison = viewsVisitors.comparison.data as StatsVisitsResponse | undefined;
	const vvHasComparison = viewsVisitors.hasComparison;
	const lcPrimary = likesComments.primary.data as StatsVisitsResponse | undefined;
	const lcComparison = likesComments.comparison.data as StatsVisitsResponse | undefined;
	const lcHasComparison = likesComments.hasComparison;

	const metrics = useMemo(
		() => [
			toMetric(
				vvPrimary,
				vvComparison,
				vvHasComparison,
				'views',
				__( 'Views', 'jetpack-premium-analytics' )
			),
			toMetric(
				vvPrimary,
				vvComparison,
				vvHasComparison,
				'visitors',
				__( 'Visitors', 'jetpack-premium-analytics' )
			),
			toMetric(
				lcPrimary,
				lcComparison,
				lcHasComparison,
				'likes',
				__( 'Likes', 'jetpack-premium-analytics' )
			),
			toMetric(
				lcPrimary,
				lcComparison,
				lcHasComparison,
				'comments',
				__( 'Comments', 'jetpack-premium-analytics' )
			),
		],
		[ vvPrimary, vvComparison, vvHasComparison, lcPrimary, lcComparison, lcHasComparison ]
	);

	return {
		metrics,
		isFetching: viewsVisitors.isFetching || likesComments.isFetching,
		isError: viewsVisitors.isError || likesComments.isError,
	};
}
