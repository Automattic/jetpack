/**
 * Internal dependencies
 */
import { useStatsLocations } from '@jetpack-premium-analytics/data';
import type {
	ReportParams,
	StatsLocationCoordinates,
	StatsLocationsComparisonItem,
} from '@jetpack-premium-analytics/data';

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
	coordinates?: StatsLocationCoordinates;
}

interface LocationFilter {
	/**
	 * ISO country code.
	 */
	country: string;
	/**
	 * Region name, such as a state or province.
	 */
	region?: string;
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
	 * Country, or a region inside it, to narrow the rows to.
	 */
	filter?: LocationFilter;
}

interface LocationViewsState {
	data: LocationView[];
	hasComparison: boolean;
	isLoading: boolean;
	isFetching: boolean;
	hasData: boolean;
	isError: boolean;
	refetch: () => void;
}

/**
 * Map a `StatsLocationsItem` from the data layer to the widget's `LocationView`
 * shape. Returns `null` for an item with no country code.
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
		coordinates: item.coordinates,
	};
}

/**
 * Fetch location views for the Locations widget via the shared Stats data layer.
 *
 * Delegates fetching, caching, and normalization to `useStatsLocations` from
 * `@jetpack-premium-analytics/data`.
 */
export default function useLocationViews( {
	reportParams,
	max,
	geoMode = 'country',
	filter,
}: UseLocationViewsArgs ): LocationViewsState {
	const statsParams: Parameters< typeof useStatsLocations >[ 0 ] = {
		...reportParams,
		geoMode,
		max,
		...( filter ? { filter_by_country: filter.country } : {} ),
		...( filter?.region ? { filter_by_region: filter.region } : {} ),
	};

	const { comparisonRows, hasComparison, isLoading, isFetching, hasData, isError, refetch } =
		useStatsLocations( statsParams, { maxRows: max } );

	const items = ( comparisonRows?.rows ?? [] )
		.map( toLocationView )
		.filter( ( v ): v is LocationView => v !== null );

	return {
		data: items,
		hasComparison,
		isLoading,
		isFetching,
		hasData,
		// `placeholderData` keeps the prior period's rows in `data` while `isError`
		// flips true, so a transient refetch failure should not replace them.
		isError: items.length === 0 && isError,
		refetch,
	};
}
