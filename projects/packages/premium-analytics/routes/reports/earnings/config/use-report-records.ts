/**
 * External dependencies
 */
import { useStatsWordAdsEarnings } from '@jetpack-premium-analytics/data';
import {
	flattenEarningsBreakdown,
	type EarningsHistoryRow,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from '@wordpress/element';

/**
 * Fetch the all-time WordAds earnings rows.
 *
 * @return Table rows and loading state.
 */
export function useEarningsReportRecords() {
	const report = useStatsWordAdsEarnings();
	const rows = useMemo< EarningsHistoryRow[] >(
		() => flattenEarningsBreakdown( report.data?.wordads ),
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
