/**
 * Internal dependencies
 */
import { useStatsUtm } from '@jetpack-premium-analytics/data';
import type {
	ReportParams,
	StatsUtmComparisonItem,
	StatsUtmComparisonTopPostItem,
	StatsUtmParam,
} from '@jetpack-premium-analytics/data';

export interface UtmInsightsChildRow {
	label: string;
	value: number;
	previousValue?: number;
	href?: string | null;
}

export interface UtmInsightsRow {
	label: string;
	value: number;
	previousValue?: number;
	children?: UtmInsightsChildRow[];
	childrenHaveComparison?: boolean;
}

interface UseUtmInsightsArgs {
	/**
	 * PA ReportParams injected by the host via attributes.
	 */
	reportParams: ReportParams;
	/**
	 * UTM dimension to break down by.
	 */
	utmParam: StatsUtmParam;
	/**
	 * Maximum rows to display (0 = all).
	 */
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

function getLabel( item: { label: unknown } ): string {
	return typeof item.label === 'string' ? item.label : String( item.label );
}

function toChildRow( item: StatsUtmComparisonTopPostItem ): UtmInsightsChildRow {
	return {
		label: getLabel( item ),
		value: item.value,
		previousValue: item.previousValue,
		href: item.href,
	};
}

function toUtmRow( item: StatsUtmComparisonItem ): UtmInsightsRow {
	return {
		label: getLabel( item ),
		value: item.value,
		previousValue: item.previousValue,
		children: item.children?.map( toChildRow ),
		childrenHaveComparison: item.childrenHaveComparison,
	};
}

/**
 * Fetch UTM insights for the UTM Insights widget via the shared Stats data layer.
 *
 * @param {UseUtmInsightsArgs} args - Hook arguments.
 * @return The current data/loading/error state.
 */
export default function useUtmInsights( {
	reportParams,
	utmParam,
	max,
}: UseUtmInsightsArgs ): UtmInsightsState {
	const params = { ...reportParams, utmParam, max } as Parameters< typeof useStatsUtm >[ 0 ];
	const { comparisonRows, hasComparison, isLoading, isFetching, hasData, isError } = useStatsUtm(
		params,
		{ maxRows: max }
	);
	const rows = ( comparisonRows?.rows ?? [] ).map( toUtmRow );

	return {
		data: rows,
		hasComparison,
		isLoading,
		isFetching,
		hasData,
		isError,
	};
}
