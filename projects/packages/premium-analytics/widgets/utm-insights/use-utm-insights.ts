/**
 * Internal dependencies
 */
import { mergeStatsComparisonRows, useStatsUtm } from '@jetpack-premium-analytics/data';
import type {
	ReportParams,
	StatsUtmParam,
	StatsUtmTopPostItem,
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

function getLabel( item: { label: unknown } ): string {
	return typeof item.label === 'string' ? item.label : String( item.label );
}

function getChildKey( item: StatsUtmTopPostItem ): string {
	return item.href ?? getLabel( item );
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

	const rawItems = ( primary.data?.data?.[ 0 ]?.items ?? [] ) as StatsUtmTopPostItem[];
	const comparisonItems = hasComparison
		? ( comparison.data?.data?.[ 0 ]?.items ?? [] ) as StatsUtmTopPostItem[]
		: [];
	const visibleItems = rawItems.slice( 0, max > 0 ? max : undefined );
	const { rows, hasComparison: hasOverlappingComparison } = mergeStatsComparisonRows<
		StatsUtmTopPostItem,
		StatsUtmTopPostItem,
		UtmInsightsRow
	>( {
		primaryRows: visibleItems,
		comparisonRows: comparisonItems,
		getPrimaryKey: getLabel,
		getComparisonKey: getLabel,
		getComparisonValue: item => item.value,
		mapRow: ( item, { previousValue, comparisonItem } ) => {
			const { rows: children, hasComparison: childrenHaveComparison } =
				mergeStatsComparisonRows<
					StatsUtmTopPostItem,
					StatsUtmTopPostItem,
					UtmInsightsChildRow
				>( {
					primaryRows: item.children ?? [],
					comparisonRows: comparisonItem?.children ?? [],
					getPrimaryKey: getChildKey,
					getComparisonKey: getChildKey,
					getComparisonValue: child => child.value,
					mapRow: ( child, { previousValue: childPreviousValue } ) => ( {
						label: getLabel( child ),
						value: child.value,
						previousValue: childPreviousValue,
						href: child.href,
					} ),
				} );

			return {
				label: getLabel( item ),
				value: item.value,
				previousValue,
				children,
				childrenHaveComparison,
			};
		},
	} );
	return {
		data: rows,
		hasComparison: hasComparison && hasOverlappingComparison,
		isLoading,
		isFetching,
		hasData,
		isError,
	};
}
