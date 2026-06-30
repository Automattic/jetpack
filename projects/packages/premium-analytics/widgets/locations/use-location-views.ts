/**
 * Internal dependencies
 */
import { useStatsLocations } from '@jetpack-premium-analytics/data';
import type {
	ReportParams,
	StatsLocationsItem,
	StatsNormalizedReport,
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
	region: string;
}

interface UseLocationViewsArgs {
	reportParams: ReportParams;
	max: number;
	geoMode?: GeoMode;
	countryFilter?: string;
}

interface LocationViewsState {
	data: LocationView[];
	comparisonData: LocationView[];
	hasComparison: boolean;
	isLoading: boolean;
	isFetching: boolean;
	hasData: boolean;
	isError: boolean;
}

/**
 * Map a `StatsLocationsItem` from the data layer to the widget's `LocationView` shape.
 *
 * @param item - Normalized location item from the data layer.
 * @return A `LocationView` for the widget, or null if the item has no country code.
 */
function toLocationView( item: StatsLocationsItem ): LocationView | null {
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
		region: item.region ?? '',
	};
}

/**
 * Fetch location views for the Locations widget via the shared Stats data layer.
 *
 * Delegates fetching, caching, and normalization to `useStatsLocations` from
 * `@jetpack-premium-analytics/data`.
 *
 * @param args               - Hook arguments.
 * @param args.reportParams  - PA ReportParams from WidgetRoot context.
 * @param args.max           - Maximum rows to display.
 * @param args.geoMode       - 'country' (default), 'region', or 'city'.
 * @param args.countryFilter - ISO country code to filter regions by (region mode).
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

	const { primary, comparison, hasComparison, isLoading, isFetching, hasData, isError } =
		useStatsLocations( statsParams );

	const report = primary.data as StatsNormalizedReport< StatsLocationsItem > | undefined;
	const comparisonReport = comparison.data as
		| StatsNormalizedReport< StatsLocationsItem >
		| undefined;
	const rawItems = report?.data?.[ 0 ]?.items ?? [];
	const rawComparisonItems = comparisonReport?.data?.[ 0 ]?.items ?? [];
	const items = rawItems
		.map( toLocationView )
		.filter( ( v ): v is LocationView => v !== null )
		.slice( 0, max > 0 ? max : undefined );
	const comparisonItems = rawComparisonItems
		.map( toLocationView )
		.filter( ( v ): v is LocationView => v !== null )
		.slice( 0, max > 0 ? max : undefined );

	return {
		data: items,
		comparisonData: comparisonItems,
		hasComparison,
		isLoading,
		isFetching,
		hasData,
		isError,
	};
}
