/**
 * External dependencies
 */
import { useStatsEmailSummary, type StatsEmailSummaryItem } from '@jetpack-premium-analytics/data';
import { useMemo } from '@wordpress/element';

/**
 * The endpoint's hard row cap: `quantity` accepts 1–30 and resets anything
 * outside that range back to 10, so the report is a top-30 list, not a full
 * archive (Calypso's legacy Emails page runs on the same limit).
 */
const MAX_EMAIL_ROWS = 30;

/**
 * Fetch the all-time email summary rows.
 *
 * @return Table rows and fetch state.
 */
export function useEmailsReportRecords() {
	const report = useStatsEmailSummary( { quantity: MAX_EMAIL_ROWS } );
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
