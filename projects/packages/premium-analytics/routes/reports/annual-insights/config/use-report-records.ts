/**
 * External dependencies
 */
import { useStatsInsights, type StatsInsightsYear } from '@jetpack-premium-analytics/data';
import { useMemo } from '@wordpress/element';

/**
 * Fetch the all-time annual insights rows.
 *
 * @return Table rows and loading state.
 */
export function useAnnualInsightsReportRecords() {
	const report = useStatsInsights();
	const rows = useMemo< StatsInsightsYear[] >(
		() =>
			[ ...( report.data?.years ?? [] ) ].sort( ( a, b ) => Number( b.year ) - Number( a.year ) ),
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
