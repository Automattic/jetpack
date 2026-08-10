/**
 * External dependencies
 */
import {
	sliceWordAdsStatsReport,
	useStatsWordAdsStats,
	type ReportParams,
	type StatsPeriod,
	type StatsWordAdsParams,
	type StatsWordAdsResponse,
} from '@jetpack-premium-analytics/data';
import { useMemo } from '@wordpress/element';
/**
 * Internal dependencies
 */
import {
	DEFAULT_WORDADS_CHART_METRICS,
	WORDADS_CHART_METRICS,
	type WordAdsChartMetricId,
} from './metrics';
import { buildMetricTab, type MetricTab } from '@jetpack-premium-analytics/widgets-toolkit';

/**
 * Granularity the chart can be grouped by. Layered onto the dashboard range as
 * its `period` (mapped to the WordAds endpoint's `unit`); the range and
 * comparison stay dashboard-driven.
 */
export type WordAdsPeriod = Extract< StatsPeriod, 'day' | 'week' | 'month' | 'year' >;

/**
 * Normalized WordAds chart state: one metric tab per WordAds field plus the
 * load/error/empty signals `WidgetState` consumes.
 */
export interface WordAdsChartState {
	metrics: MetricTab[];
	/** True on the first load, while there is no data to show yet. */
	isLoading: boolean;
	/** True while the request is fetching, including comparison refetches. */
	isFetching: boolean;
	/** True only when the request failed with no rows left to show. */
	isError: boolean;
	/** True when the current period resolved without any rows. */
	isEmpty: boolean;
	refetch: () => void;
}

/**
 * Compose the WordAds query params: the dashboard report params plus the
 * selected bucket `period` (the query factory maps it to the endpoint's `unit`).
 */
function toWordAdsParams( reportParams: ReportParams, period: WordAdsPeriod ): StatsWordAdsParams {
	return { ...reportParams, period };
}

/**
 * Fetch the WordAds time series for the dashboard's report params and expose one
 * metric tab per selected WordAds field — Ads Served (impressions), Average CPM,
 * and Revenue, matching the Calypso WordAds page's tab labels and order. Ads
 * Served is a count; CPM and revenue are currency. The endpoint returns all
 * three fields in a single request, so — unlike the traffic chart's split
 * requests — one `useStatsWordAdsStats` call drives every tab; the `metricIds`
 * selection only picks which of those tabs render.
 */
export default function useWordAdsChart(
	reportParams: ReportParams,
	period: WordAdsPeriod,
	metricIds: WordAdsChartMetricId[] = DEFAULT_WORDADS_CHART_METRICS
): WordAdsChartState {
	// Memoize the request params so the query key is stable across renders.
	const params = useMemo( () => toWordAdsParams( reportParams, period ), [ reportParams, period ] );

	const { primary, comparison, hasComparison, isLoading, isFetching, isError, refetch } =
		useStatsWordAdsStats( params );

	const primaryData = primary.data as StatsWordAdsResponse | undefined;
	const rawComparisonData = comparison.data as StatsWordAdsResponse | undefined;

	// A range ending today clamps the primary window to end yesterday (WordAds is
	// computed nightly), dropping its trailing bucket, while the past comparison
	// window keeps all of its — so it comes back one bucket longer. Trim it back
	// to the primary's bucket count so the delta compares equal-length windows and
	// the overlay aligns to the primary point-for-point.
	const comparisonData = useMemo(
		() =>
			primaryData && rawComparisonData
				? sliceWordAdsStatsReport( rawComparisonData, primaryData.data.length )
				: rawComparisonData,
		[ primaryData, rawComparisonData ]
	);

	// Resolve selected ids against the canonical definitions so the tab order
	// stays stable regardless of the order the ids were toggled in.
	const enabledMetrics = useMemo( () => {
		const selected = new Set( metricIds );
		return WORDADS_CHART_METRICS.filter( metric => selected.has( metric.id ) );
	}, [ metricIds ] );

	const metrics = useMemo(
		() =>
			enabledMetrics.map( metric =>
				buildMetricTab( {
					primary: primaryData,
					comparison: comparisonData,
					hasComparison,
					field: metric.id,
					label: metric.label,
					dataFormat: metric.dataFormat,
				} )
			),
		[ enabledMetrics, primaryData, comparisonData, hasComparison ]
	);

	return {
		metrics,
		isLoading,
		isFetching,
		// The query keeps prior data via `placeholderData`, so a failed range change
		// keeps the previous period's chart while `isError` flips true. Gate the
		// error on having nothing to show, as `useTrafficChart` does.
		isError: isError && ! primaryData?.data?.length,
		isEmpty: primaryData !== undefined && ! primaryData.data?.length,
		refetch,
	};
}
