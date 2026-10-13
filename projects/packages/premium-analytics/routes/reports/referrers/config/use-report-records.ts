/**
 * External dependencies
 */
import { useStatsReferrers, type ReportParams } from '@jetpack-premium-analytics/data';
import {
	flattenReferrerRows,
	getReferrerSpamDomain,
	getSummarizedReportQueryParams,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from '@wordpress/element';

const NO_DOMAINS: ReadonlySet< string > = new Set();

/**
 * Fetch and derive the Referrers report table records.
 *
 * @param reportParams  - The shared report-window parameters.
 * @param hiddenDomains - Spam domains to drop, with their nested rows.
 * @return Hierarchical table records.
 */
export function useReferrersReportRecords(
	reportParams: ReportParams,
	hiddenDomains: ReadonlySet< string > = NO_DOMAINS
) {
	const recordsParams = useMemo(
		() => getSummarizedReportQueryParams( reportParams ),
		[ reportParams ]
	);
	const report = useStatsReferrers( recordsParams );
	const comparisonRows = report.comparisonRows?.rows;
	const rows = useMemo(
		() =>
			flattenReferrerRows(
				( comparisonRows ?? [] ).filter( item => {
					const domain = getReferrerSpamDomain( item );

					return ! domain || ! hiddenDomains.has( domain );
				} )
			),
		[ comparisonRows, hiddenDomains ]
	);

	return {
		isError: report.isError,
		error: report.error,
		refetch: report.refetch,
		rows,
		isLoading: report.isLoading,
		isFetching: report.isFetching,
	};
}
