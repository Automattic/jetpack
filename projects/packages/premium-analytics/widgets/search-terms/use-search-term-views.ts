/**
 * Internal dependencies
 */
import { useStatsSearchTerms } from '@jetpack-premium-analytics/data';
import type {
	ReportParams,
	StatsNormalizedReport,
	StatsSearchTermsItem,
} from '@jetpack-premium-analytics/data';

export interface SearchTermView {
	label: string;
	views: number;
	previousViews: number;
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

function itemLabel( item: StatsSearchTermsItem ): string {
	return typeof item.label === 'string' ? item.label : String( item.label );
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
	const { primary, comparison, hasComparison, isFetching, refetch } = useStatsSearchTerms(
		reportParams as Parameters< typeof useStatsSearchTerms >[ 0 ]
	);

	const primaryReport = primary.data as StatsNormalizedReport< StatsSearchTermsItem > | undefined;
	const rawItems = primaryReport?.data?.[ 0 ]?.items ?? [];

	const comparisonReport = comparison.data as
		| StatsNormalizedReport< StatsSearchTermsItem >
		| undefined;
	const comparisonItems = comparisonReport?.data?.[ 0 ]?.items ?? [];
	const comparisonByLabel = new Map( comparisonItems.map( i => [ itemLabel( i ), i.views ] ) );

	// When comparison is requested but its query fails, drop to a non-comparison
	// view rather than pairing every term with a `previousViews` of 0 — otherwise
	// the chart renders misleading period-over-period deltas from placeholder
	// zeros. Primary rows still show; they just lose comparison values.
	const comparisonUsable = hasComparison && ! comparison.isError;

	const items = rawItems
		.map( item => ( {
			label: itemLabel( item ),
			views: item.views,
			previousViews: comparisonUsable ? comparisonByLabel.get( itemLabel( item ) ) ?? 0 : 0,
		} ) )
		.slice( 0, max > 0 ? max : undefined );

	return {
		data: items,
		isLoading: primary.isLoading || ( hasComparison && comparison.isLoading ),
		isFetching,
		// The Stats queries carry `placeholderData: previousData => previousData`, so a
		// failed range change keeps the prior period's rows in `data` while `isError`
		// flips true. Only surface the error when there's nothing to show, so a transient
		// refetch failure doesn't replace populated rows with the error state.
		isError: items.length === 0 && ( primary.isError || ( hasComparison && comparison.isError ) ),
		hasComparison: comparisonUsable,
		// The data layer's combined refetch: memoized, awaits both queries, and
		// skips the comparison query when comparison is disabled.
		refetch,
	};
}
