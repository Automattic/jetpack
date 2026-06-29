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
}

interface UseUtmInsightsArgs {
	reportParams: ReportParams;
	utmParam: StatsUtmParam;
	max: number;
}

interface UtmInsightsState {
	data: UtmInsightsRow[];
	isLoading: boolean;
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
	const { primary } = useStatsUtm( params );

	const isLoading = primary.isLoading;
	const isError = primary.isError;

	const report = primary.data as StatsNormalizedReport< StatsUtmItem > | undefined;
	const rawItems = report?.data?.[ 0 ]?.items ?? [];
	const items = rawItems
		.map( item => ( {
			label: typeof item.label === 'string' ? item.label : String( item.label ),
			value: item.value,
		} ) )
		.slice( 0, max > 0 ? max : undefined );

	return { data: items, isLoading, isError };
}
