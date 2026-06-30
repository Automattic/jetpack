/**
 * Internal dependencies
 */
import { useStatsUtm } from '@jetpack-premium-analytics/data';
import type {
	ReportParams,
	StatsNormalizedReport,
	StatsUtmItem,
	StatsUtmParam,
} from '@jetpack-premium-analytics/data';

export interface UtmInsightsRow {
	label: string;
	value: number;
	previousValue: number;
}

interface UseUtmInsightsArgs {
	reportParams: ReportParams;
	utmParam: StatsUtmParam;
	max: number;
}

interface UtmInsightsState {
	data: UtmInsightsRow[];
	hasComparison: boolean;
	isLoading: boolean;
	isFetching: boolean;
	hasData: boolean;
	isError: boolean;
}

/**
 * Fetch UTM insights for the UTM Insights widget via the shared Stats data layer.
 *
 * @param args              - Hook arguments.
 * @param args.reportParams - PA ReportParams injected by the host via attributes.
 * @param args.utmParam     - UTM dimension to break down by.
 * @param args.max          - Maximum rows to display (0 = all).
 * @return The current data/loading/error state.
 */
export default function useUtmInsights( {
	reportParams,
	utmParam,
	max,
}: UseUtmInsightsArgs ): UtmInsightsState {
	const params = { ...reportParams, utmParam, max } as Parameters< typeof useStatsUtm >[ 0 ];
	const { primary, comparison, hasComparison, isLoading, isFetching, hasData, isError } =
		useStatsUtm( params );

	const primaryReport = primary.data as StatsNormalizedReport< StatsUtmItem > | undefined;
	const comparisonReport = comparison.data as StatsNormalizedReport< StatsUtmItem > | undefined;
	const rawItems = primaryReport?.data?.[ 0 ]?.items ?? [];
	const comparisonItems = comparisonReport?.data?.[ 0 ]?.items ?? [];
	const comparisonByLabel = new Map(
		comparisonItems.map( item => [
			typeof item.label === 'string' ? item.label : String( item.label ),
			item.value,
		] )
	);
	const items = rawItems
		.map( item => {
			const label = typeof item.label === 'string' ? item.label : String( item.label );

			return {
				label,
				value: item.value,
				previousValue: hasComparison ? comparisonByLabel.get( label ) ?? 0 : 0,
			};
		} )
		.slice( 0, max > 0 ? max : undefined );

	return { data: items, hasComparison, isLoading, isFetching, hasData, isError };
}
