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
	isFetching: boolean;
	isError: boolean;
	hasComparison: boolean;
	refetch: () => void;
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
	const {
		comparisonRows,
		comparison,
		hasComparison,
		isLoading,
		isFetching,
		isError: hasError,
		refetch,
	} = useStatsSearchTerms( reportParams as Parameters< typeof useStatsSearchTerms >[ 0 ], {
		maxRows: max,
	} );

	const comparisonUsable = hasComparison && ! comparison.isError;
	const items = ( comparisonRows?.rows ?? [] ).map( ( item: StatsSearchTermsComparisonItem ) => ( {
		label: typeof item.label === 'string' ? item.label : String( item.label ),
		views: item.views,
		previousViews: comparisonUsable ? item.previousViews : undefined,
	} ) );

	return {
		data: items,
		isLoading,
		isFetching,
		// The Stats queries carry `placeholderData: previousData => previousData`, so a
		// failed range change keeps the prior period's rows in `data` while `isError`
		// flips true. Only surface the error when there's nothing to show, so a transient
		// refetch failure doesn't replace populated rows with the error state.
		isError: items.length === 0 && hasError,
		hasComparison: comparisonUsable,
		// The data layer's combined refetch: memoized, awaits both queries, and
		// skips the comparison query when comparison is disabled.
		refetch,
	};
}
