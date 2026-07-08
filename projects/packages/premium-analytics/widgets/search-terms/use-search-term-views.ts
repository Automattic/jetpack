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
	reportParams: ReportParams;
	max: number;
}

interface SearchTermViewsState {
	data: SearchTermView[];
	isLoading: boolean;
	isError: boolean;
	hasComparison: boolean;
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
 * @param args              - Hook arguments.
 * @param args.reportParams - PA ReportParams from WidgetRoot context.
 * @param args.max          - Maximum rows to display.
 * @return The current data/loading/error state.
 */
export default function useSearchTermViews( {
	reportParams,
	max,
}: UseSearchTermViewsArgs ): SearchTermViewsState {
	const { primary, comparison, hasComparison } = useStatsSearchTerms(
		reportParams as Parameters< typeof useStatsSearchTerms >[ 0 ]
	);

	const primaryReport = primary.data as StatsNormalizedReport< StatsSearchTermsItem > | undefined;
	const rawItems = primaryReport?.data?.[ 0 ]?.items ?? [];

	const comparisonReport = comparison.data as
		| StatsNormalizedReport< StatsSearchTermsItem >
		| undefined;
	const comparisonItems = comparisonReport?.data?.[ 0 ]?.items ?? [];
	const comparisonByLabel = new Map( comparisonItems.map( i => [ itemLabel( i ), i.views ] ) );

	const items = rawItems
		.map( item => ( {
			label: itemLabel( item ),
			views: item.views,
			previousViews: hasComparison ? comparisonByLabel.get( itemLabel( item ) ) ?? 0 : 0,
		} ) )
		.slice( 0, max > 0 ? max : undefined );

	return {
		data: items,
		isLoading: primary.isLoading || ( hasComparison && comparison.isLoading ),
		isError: primary.isError || ( hasComparison && comparison.isError ),
		hasComparison,
	};
}
