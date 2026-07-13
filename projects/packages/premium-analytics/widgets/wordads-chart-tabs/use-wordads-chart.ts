/**
 * External dependencies
 */
import {
	localTZDate,
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
import type { DataFormat, MetricTab } from '@jetpack-premium-analytics/widgets-toolkit';

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
	isError: boolean;
	/** True when the current period resolved without any rows. */
	isEmpty: boolean;
	refetch: () => void;
}

/**
 * Read a single field's total from a normalized WordAds report's summary — the
 * headline value the metric card shows (impressions/revenue are period sums; CPM
 * is the period-weighted average the sanitizer computes).
 *
 * @param report - The normalized WordAds report, or undefined while loading.
 * @param field  - The metric field to total (impressions/revenue/cpm).
 * @return The summary total, or 0 when the report is empty.
 */
function total( report: StatsWordAdsResponse | undefined, field: string ): number {
	return Number( report?.summary?.[ field ] ?? 0 );
}

/**
 * Map a single field of a normalized WordAds report into chart points.
 *
 * @param report - The normalized WordAds report, or undefined while loading.
 * @param field  - The metric field to read from each period.
 * @return One point per period, oldest first.
 */
function toPoints( report: StatsWordAdsResponse | undefined, field: string ) {
	return ( report?.data ?? [] ).map( point => ( {
		date: localTZDate( point.date_start ),
		value: Number( point[ field as keyof typeof point ] ?? 0 ),
	} ) );
}

/**
 * Build one metric tab. The headline is the period total; the previous-period
 * total and overlay are included only when comparison is on *and* the comparison
 * request actually returned rows — while that request is still loading or came
 * back empty, `total()` would be `0`, which would render a misleading
 * previous-period value.
 *
 * @param primary       - The current-period report.
 * @param comparison    - The previous-period report, when comparison is on.
 * @param hasComparison - Whether the dashboard comparison is enabled.
 * @param field         - The metric field, also used as the tab key.
 * @param label         - The translated tab label.
 * @param dataFormat    - Optional per-metric format override (currency for revenue/CPM).
 * @return The metric tab.
 */
function toMetric(
	primary: StatsWordAdsResponse | undefined,
	comparison: StatsWordAdsResponse | undefined,
	hasComparison: boolean,
	field: string,
	label: string,
	dataFormat?: DataFormat
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
		dataFormat,
	};
}

/**
 * Compose the WordAds query params: the dashboard report params plus the
 * selected bucket `period` (the query factory maps it to the endpoint's `unit`).
 *
 * @param reportParams - The dashboard report params.
 * @param period       - The selected bucket granularity.
 * @return The WordAds query params.
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
 *
 * @param reportParams - The dashboard date range + comparison state.
 * @param period       - The selected bucket granularity (day/week/month).
 * @param metricIds    - Which metrics to show as tabs; defaults to all.
 * @return The metric tabs and combined load/error/empty state.
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
				toMetric(
					primaryData,
					comparisonData,
					hasComparison,
					metric.id,
					metric.label,
					metric.dataFormat
				)
			),
		[ enabledMetrics, primaryData, comparisonData, hasComparison ]
	);

	return {
		metrics,
		isLoading,
		isFetching,
		isError,
		isEmpty: primaryData !== undefined && ! primaryData.data?.length,
		refetch,
	};
}
