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
 * Internal dependencies
 */
import {
	DEFAULT_TAB_ID,
	EARNINGS_BUCKETS,
	EARNINGS_TAB_IDS,
	type EarningsReportTabId,
} from './tabs';

/**
 * Fetch the all-time earnings rows for one tab's bucket.
 *
 * A tab whose bucket is empty falls back to WordAds once the payload says so.
 * Until then the asked-for tab is trusted, so a deep link does not flicker.
 *
 * @param tab - The tab the URL asks for.
 * @return The tab actually reported, its rows, the tabs to offer, and loading state.
 */
export function useEarningsReportRecords( tab: EarningsReportTabId ) {
	const report = useStatsWordAdsEarnings();
	const data = report.data;

	// WordAds is the report's home and always offered; the other buckets are
	// empty on nearly every site, so their tabs appear only when they have rows.
	const availableTabs = useMemo(
		() =>
			EARNINGS_TAB_IDS.filter(
				id =>
					id === DEFAULT_TAB_ID || Object.keys( data?.[ EARNINGS_BUCKETS[ id ] ] ?? {} ).length > 0
			),
		[ data ]
	);
	const activeTab: EarningsReportTabId =
		! data || availableTabs.includes( tab ) ? tab : DEFAULT_TAB_ID;
	const rows = useMemo< EarningsHistoryRow[] >(
		() => flattenEarningsBreakdown( data?.[ EARNINGS_BUCKETS[ activeTab ] ] ),
		[ data, activeTab ]
	);

	return {
		tab: activeTab,
		rows,
		availableTabs,
		isLoading: report.isLoading,
		isFetching: report.isFetching,
		isError: report.isError,
		refetch: report.refetch,
	};
}
