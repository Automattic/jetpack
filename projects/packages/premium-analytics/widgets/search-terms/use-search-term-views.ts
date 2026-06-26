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
}

interface UseSearchTermViewsArgs {
	reportParams: ReportParams;
	max: number;
}

interface SearchTermViewsState {
	data: SearchTermView[];
	isLoading: boolean;
	isError: boolean;
}

function toSearchTermView( item: StatsSearchTermsItem ): SearchTermView {
	return {
		label: typeof item.label === 'string' ? item.label : String( item.label ),
		views: item.views,
	};
}

/**
 * Fetch search term views for the Search Terms widget via the shared Stats data layer.
 *
 * Delegates fetching, caching, and normalization to `useStatsSearchTerms` from
 * `@jetpack-premium-analytics/data`.
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
	const { primary } = useStatsSearchTerms(
		reportParams as Parameters< typeof useStatsSearchTerms >[ 0 ]
	);

	const isLoading = primary.isLoading;
	const isError = primary.isError;

	const report = primary.data as StatsNormalizedReport< StatsSearchTermsItem > | undefined;
	const rawItems = report?.data?.[ 0 ]?.items ?? [];
	const items = rawItems.map( toSearchTermView ).slice( 0, max > 0 ? max : undefined );

	return {
		data: items,
		isLoading,
		isError,
	};
}
