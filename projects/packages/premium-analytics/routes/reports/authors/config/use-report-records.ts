/**
 * External dependencies
 */
import {
	useStatsTopAuthors,
	type ReportParams,
	type StatsPeriod,
} from '@jetpack-premium-analytics/data';
import { useMemo } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { aggregateAuthorRows, authorsToTimeSeries } from './aggregate';

/**
 * Fetch and derive the Authors chart and table from one bucketed report.
 *
 * @param reportParams - The shared report-window parameters.
 * @param chartPeriod  - The chart's bucket period.
 * @return Chart data and aggregate author table rows.
 */
export function useAuthorsReportRecords( reportParams: ReportParams, chartPeriod: StatsPeriod ) {
	/*
	 * `summarize: 0` keeps the interval buckets needed by the chart, while
	 * `max: 0` requests every author so search, sorting, and pagination can run
	 * client-side. The same hook result feeds both sections.
	 */
	const recordsParams = useMemo(
		() => ( {
			...reportParams,
			max: 0,
			summarize: 0,
			period: chartPeriod,
		} ),
		[ reportParams, chartPeriod ]
	);
	const authors = useStatsTopAuthors( recordsParams );

	const chartPrimary = useMemo(
		() => authorsToTimeSeries( authors.primary.data ),
		[ authors.primary.data ]
	);
	const chartComparison = useMemo( () => {
		if ( ! reportParams.compare_from || ! reportParams.compare_to ) {
			return undefined;
		}

		return authorsToTimeSeries( authors.comparison.data );
	}, [ reportParams, authors.comparison.data ] );
	const rows = useMemo(
		() => aggregateAuthorRows( authors.primary.data ),
		[ authors.primary.data ]
	);

	return {
		chart: {
			primary: chartPrimary,
			comparison: authors.hasComparison ? chartComparison : undefined,
			isLoading: authors.isLoading,
		},
		authors: {
			rows,
			isLoading: authors.isLoading,
		},
	};
}
