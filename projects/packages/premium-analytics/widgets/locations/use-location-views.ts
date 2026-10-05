/**
 * Internal dependencies
 */
import { useStatsLocations } from '@jetpack-premium-analytics/data';
import type {
	ReportParams,
	StatsLocationCoordinates,
	StatsLocationsComparisonItem,
} from '@jetpack-premium-analytics/data';
import {
	getLocationsScopeParams,
	type LocationsScope,
} from '@jetpack-premium-analytics/widgets-toolkit';

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
	filter?: LocationsScope;
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

/** Map a Stats location row to the widget's view shape, including unknown countries. */
function toLocationView( item: StatsLocationsComparisonItem ): LocationView {
	const label = typeof item.label === 'string' ? item.label : String( item.label );
	const countryCode = item.countryCode ?? '';
	const countryFull = item.countryFull ?? countryCode;

	return {
		key: `${ countryCode }:${ label }`,
		label,
		countryCode,
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
		...getLocationsScopeParams( filter ),
	};

	const { comparisonRows, hasComparison, isLoading, isFetching, hasData, isError, refetch } =
		useStatsLocations( statsParams, { maxRows: max } );

	const items = ( comparisonRows?.rows ?? [] ).map( toLocationView );

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
