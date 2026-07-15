/**
 * Internal dependencies
 */
import { useStatsLocations } from '@jetpack-premium-analytics/data';
import type { ReportParams, StatsLocationsComparisonItem } from '@jetpack-premium-analytics/data';

export type GeoMode = 'country' | 'region' | 'city';

/**
 * A single normalized location-views row for the widget.
 */
export interface LocationView {
	key: string;
	label: string;
	countryCode: string;
	countryFull: string;
	value: number;
	previousValue?: number;
	region: string;
}

interface UseLocationViewsArgs {
	/**
	 * PA ReportParams from WidgetRoot context.
	 */
	reportParams: ReportParams;
	/**
	 * Maximum rows to display.
	 */
	max: number;
	/**
	 * 'country' (default), 'region', or 'city'.
	 */
	geoMode?: GeoMode;
	/**
	 * ISO country code to filter regions by (region mode).
	 */
	countryFilter?: string;
}

interface LocationViewsState {
	data: LocationView[];
	hasComparison: boolean;
	isLoading: boolean;
	isFetching: boolean;
	hasData: boolean;
	isError: boolean;
	isPlaceholderData: boolean;
	refetch: () => void;
}

/**
 * Map a `StatsLocationsItem` from the data layer to the widget's `LocationView` shape.
 *
 * @param item - Normalized location item from the data layer.
 * @return A `LocationView` for the widget, or null if the item has no country code.
 */
function toLocationView( item: StatsLocationsComparisonItem ): LocationView | null {
	if ( ! item.countryCode ) {
		return null;
	}
	const label = typeof item.label === 'string' ? item.label : String( item.label );
	const countryFull = item.countryFull ?? item.countryCode;

	return {
		key: `${ item.countryCode }:${ label }`,
		label,
		countryCode: item.countryCode,
		countryFull,
		value: item.views,
		previousValue: item.previousViews,
		region: item.region ?? '',
	};
}

/**
 * Fetch location views for the Locations widget via the shared Stats data layer.
 *
 * Delegates fetching, caching, and normalization to `useStatsLocations` from
 * `@jetpack-premium-analytics/data`.
 *
 * @param {UseLocationViewsArgs} args - Hook arguments.
 * @return The current data/loading/error state.
 */
export default function useLocationViews( {
	reportParams,
	max,
	geoMode = 'country',
	countryFilter,
}: UseLocationViewsArgs ): LocationViewsState {
	const statsParams = {
		...reportParams,
		geoMode,
		max,
		...( countryFilter ? { filter_by_country: countryFilter } : {} ),
	} as Parameters< typeof useStatsLocations >[ 0 ];

	const {
		primary,
		comparison,
		comparisonRows,
		hasComparison,
		isLoading,
		isFetching,
		hasData,
		isError,
		refetch,
	} = useStatsLocations( statsParams, { maxRows: max } );
	const isPlaceholderData = primary.isPlaceholderData || comparison.isPlaceholderData;

	const items = ( comparisonRows?.rows ?? [] )
		.map( toLocationView )
		.filter( ( v ): v is LocationView => v !== null );

	return {
		data: items,
		hasComparison,
		isLoading,
		isFetching,
		hasData,
		// The Stats queries carry `placeholderData: previousData => previousData`, so a
		// failed range change keeps the prior period's rows in `data` while `isError`
		// flips true. Only surface the error when there's nothing to show, so a transient
		// refetch failure doesn't replace populated rows with the error state.
		isError: items.length === 0 && isError,
		isPlaceholderData,
		// The data layer's combined refetch: memoized, awaits both queries, and
		// skips the comparison query when comparison is disabled.
		refetch,
	};
}
