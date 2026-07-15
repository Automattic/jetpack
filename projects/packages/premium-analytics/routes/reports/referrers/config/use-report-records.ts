/**
 * External dependencies
 */
import {
	useStatsReferrers,
	type ReportParams,
	type StatsPeriod,
} from '@jetpack-premium-analytics/data';
import { useMemo } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { aggregateReferrerRows, referrersToTimeSeries } from './aggregate';

type ReferrerChartPeriod = Extract< StatsPeriod, 'day' | 'week' | 'month' >;

/**
 * Fetch and derive the Referrers report chart and table records.
 *
 * @param reportParams - The shared report-window parameters.
 * @param chartPeriod  - The chart's bucket period.
 * @return Chart data and table records.
 */
export function useReferrersReportRecords(
	reportParams: ReportParams,
	chartPeriod: ReferrerChartPeriod
) {
	// A single bucketed query feeds both report sections. `summarize: 0`
	// preserves the time buckets for the chart, and `max: 0` requests every
	// referrer so table search, sorting, and pagination remain client-side.
	const recordsParams = useMemo(
		() => ( {
			...reportParams,
			max: 0,
			summarize: 0,
			period: 'day',
		} ),
		[ reportParams ]
	);
	const report = useStatsReferrers( recordsParams );

	const chartPrimary = useMemo(
		() => referrersToTimeSeries( report.primary.data, chartPeriod ),
		[ report.primary.data, chartPeriod ]
	);
	const chartComparison = useMemo( () => {
		if ( ! reportParams.compare_from || ! reportParams.compare_to ) {
			return undefined;
		}

		return referrersToTimeSeries( report.comparison.data, chartPeriod );
	}, [ reportParams, report.comparison.data, chartPeriod ] );
	const rows = useMemo(
		() => aggregateReferrerRows( report.primary.data ),
		[ report.primary.data ]
	);

	return {
		chart: {
			primary: chartPrimary,
			comparison: report.hasComparison ? chartComparison : undefined,
			isLoading: report.isLoading,
		},
		rows,
		isLoading: report.isLoading,
	};
}
