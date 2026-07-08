/**
 * Internal dependencies
 */
import { useStatsSearchTerms } from '@jetpack-premium-analytics/data';
import type { ReportParams, StatsSearchTermsComparisonItem } from '@jetpack-premium-analytics/data';

export interface SearchTermView {
	label: string;
	views: number;
	previousViews?: number;
}

interface UseSearchTermViewsArgs {
	/**
	 * PA ReportParams from WidgetRoot context.
	 */
	reportParams: ReportParams;
	/**
	 * Maximum rows to display.
	 */
	max: number;
}

interface SearchTermViewsState {
	data: SearchTermView[];
	isLoading: boolean;
	isError: boolean;
	hasComparison: boolean;
}

/**
 * Fetch search term views for the Search Terms widget via the shared Stats data layer.
 *
 * Delegates fetching, caching, and normalization to `useStatsSearchTerms` from
 * `@jetpack-premium-analytics/data`. When comparison params are present, the hook
 * fetches both periods and pairs each primary term with its comparison view count.
 *
 * @param {UseSearchTermViewsArgs} args - Hook arguments.
 * @return The current data/loading/error state.
 */
export default function useSearchTermViews( {
	reportParams,
	max,
}: UseSearchTermViewsArgs ): SearchTermViewsState {
	const { comparisonRows, hasComparison, isLoading, isError } = useStatsSearchTerms(
		reportParams as Parameters< typeof useStatsSearchTerms >[ 0 ],
		{ maxRows: max }
	);

	const rows = ( comparisonRows?.rows ?? [] ).map( ( item: StatsSearchTermsComparisonItem ) => ( {
		label: typeof item.label === 'string' ? item.label : String( item.label ),
		views: item.views,
		previousViews: item.previousViews,
	} ) );

	return {
		data: rows,
		isLoading,
		isError,
		hasComparison,
	};
}
