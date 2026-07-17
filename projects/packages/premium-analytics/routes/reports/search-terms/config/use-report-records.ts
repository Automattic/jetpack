/**
 * External dependencies
 */
import {
	useStatsSearchTerms,
	type ReportParams,
	type StatsChartBucketPeriod,
} from '@jetpack-premium-analytics/data';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { aggregateSearchTermRows, searchTermsToTimeSeries } from './aggregate';

/**
 * Fetch and derive the chart and table records for the Search terms report.
 *
 * @param reportParams - The shared report-window parameters.
 * @param chartPeriod  - The chart's bucket period.
 * @return Chart data and table records.
 */
export function useSearchTermsReportRecords(
	reportParams: ReportParams,
	chartPeriod: StatsChartBucketPeriod
) {
	/*
	 * One bucketed report feeds both the chart and table. `summarize: 0` keeps
	 * the per-period buckets, while `max: 0` requests all known terms for
	 * client-side search, sorting, and pagination.
	 */
	const recordsParams = useMemo(
		() => ( {
			...reportParams,
			max: 0,
			summarize: 0,
			period: 'day',
		} ),
		[ reportParams ]
	);
	const report = useStatsSearchTerms( recordsParams );
	const unknownLabel = __( 'Unknown search terms', 'jetpack-premium-analytics' );

	const chartPrimary = useMemo(
		() => searchTermsToTimeSeries( report.primary.data, chartPeriod ),
		[ report.primary.data, chartPeriod ]
	);
	const chartComparison = useMemo( () => {
		if ( ! reportParams.compare_from || ! reportParams.compare_to ) {
			return undefined;
		}

		return searchTermsToTimeSeries( report.comparison.data, chartPeriod );
	}, [ reportParams, report.comparison.data, chartPeriod ] );
	const rows = useMemo(
		() => aggregateSearchTermRows( report.primary.data, unknownLabel ),
		[ report.primary.data, unknownLabel ]
	);

	return {
		chart: {
			primary: chartPrimary,
			comparison: report.comparison.data ? chartComparison : undefined,
			isLoading: report.isLoading,
		},
		table: {
			rows,
			isLoading: report.isLoading,
		},
	};
}
