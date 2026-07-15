/**
 * External dependencies
 */
import {
	useStatsClicks,
	type ReportParams,
	type StatsPeriod,
} from '@jetpack-premium-analytics/data';
import { useMemo } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { aggregateClickRows, clicksToTimeSeries } from './aggregate';

/**
 * Fetch and derive the Clicks chart and table from one bucketed query.
 *
 * @param reportParams - The shared report-window parameters.
 * @param chartPeriod  - The chart's bucket period.
 * @return Chart data and flat clicked-URL rows.
 */
export function useClicksReportRecords( reportParams: ReportParams, chartPeriod: StatsPeriod ) {
	const recordsParams = useMemo(
		() => ( {
			...reportParams,
			max: 0,
			summarize: 0,
			period: chartPeriod,
		} ),
		[ reportParams, chartPeriod ]
	);
	const report = useStatsClicks( recordsParams );

	const chartPrimary = useMemo(
		() => clicksToTimeSeries( report.primary.data ),
		[ report.primary.data ]
	);
	const chartComparison = useMemo( () => {
		if ( ! reportParams.compare_from || ! reportParams.compare_to ) {
			return undefined;
		}

		return clicksToTimeSeries( report.comparison.data );
	}, [ reportParams, report.comparison.data ] );
	const rows = useMemo( () => aggregateClickRows( report.primary.data ), [ report.primary.data ] );

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
