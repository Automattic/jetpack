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
	reportParams: ReportParams;
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
 * @param args              - Hook arguments.
 * @param args.reportParams - PA ReportParams from WidgetRoot context.
 * @param args.max          - Maximum rows to display.
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
