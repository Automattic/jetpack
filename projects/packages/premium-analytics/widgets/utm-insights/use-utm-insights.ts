/**
 * Internal dependencies
 */
import { useStatsUtm } from '@jetpack-premium-analytics/data';
import type {
	ReportParams,
	StatsUtmParam,
	StatsUtmTopPostItem,
} from '@jetpack-premium-analytics/data';

export interface UtmInsightsChildRow {
	label: string;
	value: number;
	previousValue: number;
	href?: string | null;
}

export interface UtmInsightsRow {
	label: string;
	value: number;
	previousValue: number;
	children?: UtmInsightsChildRow[];
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

function getChildKey( item: StatsUtmTopPostItem ): string {
	return item.href ?? getLabel( item );
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
	const { primary, comparison, hasComparison, isLoading, isFetching, hasData, isError } =
		useStatsUtm( params );

	const rawItems = primary.data?.data?.[ 0 ]?.items ?? [];
	const comparisonItems = comparison.data?.data?.[ 0 ]?.items ?? [];
	const comparisonByLabel = new Map( comparisonItems.map( item => [ getLabel( item ), item ] ) );
	const items = rawItems
		.map( item => {
			const label = getLabel( item );
			const comparisonItem = comparisonByLabel.get( label );
			const comparisonChildren = comparisonItem?.children ?? [];
			const comparisonChildrenByKey = new Map(
				comparisonChildren.map( child => [ getChildKey( child ), child.value ] )
			);
			const children = ( item.children ?? [] ).map( child => {
				const childKey = getChildKey( child );

				return {
					label: getLabel( child ),
					value: child.value,
					previousValue: hasComparison ? comparisonChildrenByKey.get( childKey ) ?? 0 : 0,
					href: child.href,
				};
			} );

			return {
				label,
				value: item.value,
				previousValue: hasComparison ? comparisonItem?.value ?? 0 : 0,
				children,
			};
		} )
		.slice( 0, max > 0 ? max : undefined );

	return { data: items, hasComparison, isLoading, isFetching, hasData, isError };
}
