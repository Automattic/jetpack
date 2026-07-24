/**
 * External dependencies
 */
import {
	hasComparisonEnabled,
	useStatsSearchTerms,
	type ReportParams,
} from '@jetpack-premium-analytics/data';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { aggregateSearchTermRows } from './aggregate';

/**
 * Fetch and derive the table records for the Search terms report.
 *
 * @param reportParams - The shared report-window parameters.
 * @return Table records.
 */
export function useSearchTermsReportRecords( reportParams: ReportParams ) {
	/*
	 * Keep per-period buckets so encrypted search counts can be aggregated into
	 * the table's "Unknown search terms" row. `max: 0` requests all known terms
	 * for client-side search, sorting, and pagination.
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
	const unknownLabel = __( 'Unknown search terms', 'jetpack-premium-analytics-pkg' );
	const comparisonEnabled = hasComparisonEnabled( reportParams );

	const table = useMemo(
		() =>
			aggregateSearchTermRows(
				report.primary.data,
				unknownLabel,
				comparisonEnabled ? report.comparison.data : undefined
			),
		[ comparisonEnabled, report.primary.data, report.comparison.data, unknownLabel ]
	);

	return {
		isError: report.isError,
		refetch: report.refetch,
		table: {
			...table,
			isLoading: report.isLoading,
		},
	};
}
