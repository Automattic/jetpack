/**
 * External dependencies
 */
import { useStatsEmailSummary, type StatsEmailSummaryItem } from '@jetpack-premium-analytics/data';
import { EMAILS_REPORT_ROW_LIMIT } from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from '@wordpress/element';

/**
 * Fetch the all-time email summary rows.
 *
 * @return Table rows and fetch state.
 */
export function useEmailsReportRecords() {
	const report = useStatsEmailSummary( { quantity: EMAILS_REPORT_ROW_LIMIT } );
	const rows = useMemo< StatsEmailSummaryItem[] >(
		() => report.data?.data?.[ 0 ]?.items ?? [],
		[ report.data ]
	);

	return {
		rows,
		isLoading: report.isLoading,
		isFetching: report.isFetching,
		isError: report.isError,
		refetch: report.refetch,
	};
}
