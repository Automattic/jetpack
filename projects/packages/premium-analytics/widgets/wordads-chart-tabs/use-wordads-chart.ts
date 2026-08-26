/**
 * External dependencies
 */
import {
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
import { WORDADS_CHART_METRICS } from './metrics';
import { buildMetricTab, type MetricTab } from '@jetpack-premium-analytics/widgets-toolkit';

/**
 * Supported WordAds chart bucket sizes.
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
	isFetching: boolean;
	/** True only when the request failed with no rows left to show. */
	isError: boolean;
	/** True when the current period resolved without any rows. */
	isEmpty: boolean;
	refetch: () => void;
}

/**
 * Add the selected bucket period; the query factory maps it to the endpoint's `unit`.
 */
function toWordAdsParams( reportParams: ReportParams, period: WordAdsPeriod ): StatsWordAdsParams {
	return { ...reportParams, period };
}

/**
 * Fetch the WordAds time series and expose its three fields as metric tabs — Ads
 * Served (impressions), Average CPM, and Revenue, matching the Calypso WordAds
 * page's tab labels and order. The endpoint returns all three in a single
 * request, so — unlike the traffic chart's split requests — one
 * `useStatsWordAdsStats` call drives every tab.
 */
export default function useWordAdsChart(
	reportParams: ReportParams,
	period: WordAdsPeriod
): WordAdsChartState {
	// Memoize the request params so the query key is stable across renders.
	const params = useMemo( () => toWordAdsParams( reportParams, period ), [ reportParams, period ] );

	const { primary, isLoading, isFetching, isError, refetch } = useStatsWordAdsStats( params );

	const primaryData = primary.data as StatsWordAdsResponse | undefined;

	const metrics = useMemo(
		() =>
			WORDADS_CHART_METRICS.map( metric =>
				buildMetricTab( {
					primary: primaryData,
					comparison: undefined,
					hasComparison: false,
					field: metric.id,
					label: metric.label,
					dataFormat: metric.dataFormat,
				} )
			),
		[ primaryData ]
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
