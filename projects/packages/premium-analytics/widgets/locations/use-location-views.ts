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
	isLoading: boolean;
	isError: boolean;
	/**
	 * True when showing bundled placeholder data (site not connected or request failed).
	 */
	isSample: boolean;
}

/** Country-level placeholder data shown when the site isn't connected or the request fails. */
const SAMPLE_LOCATIONS: LocationView[] = [
	{
		label: 'United States',
		countryCode: 'US',
		countryFull: 'United States',
		value: 2000,
		region: '021',
	},
	{ label: 'India', countryCode: 'IN', countryFull: 'India', value: 1500, region: '034' },
	{
		label: 'United Kingdom',
		countryCode: 'GB',
		countryFull: 'United Kingdom',
		value: 1200,
		region: '154',
	},
	{ label: 'Canada', countryCode: 'CA', countryFull: 'Canada', value: 1000, region: '021' },
	{ label: 'Germany', countryCode: 'DE', countryFull: 'Germany', value: 900, region: '155' },
	{ label: 'Indonesia', countryCode: 'ID', countryFull: 'Indonesia', value: 800, region: '035' },
	{ label: 'Japan', countryCode: 'JP', countryFull: 'Japan', value: 700, region: '030' },
	{ label: 'Brazil', countryCode: 'BR', countryFull: 'Brazil', value: 600, region: '005' },
	{
		label: 'Netherlands',
		countryCode: 'NL',
		countryFull: 'Netherlands',
		value: 500,
		region: '155',
	},
	{ label: 'Spain', countryCode: 'ES', countryFull: 'Spain', value: 400, region: '039' },
];

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
	return {
		label: typeof item.label === 'string' ? item.label : String( item.label ),
		countryCode: item.countryCode,
		countryFull: item.countryFull ?? item.countryCode,
		value: item.views,
		region: item.region ?? '',
	};
}

/**
 * Fetch location views for the Locations widget via the shared Stats data layer.
 *
 * Delegates fetching, caching, and normalization to `useStatsLocations` from
 * `@jetpack-premium-analytics/data`. Falls back to bundled sample data when the
 * query has no data (e.g. site not connected → disabled query).
 *
 * @param args               - Hook arguments.
 * @param args.reportParams  - PA ReportParams from WidgetRoot context.
 * @param args.max           - Maximum rows to display.
 * @param args.geoMode       - 'country' (default), 'region', or 'city'.
 * @param args.countryFilter - ISO country code to filter regions by (region mode).
 * @return The current data/loading/error/sample state.
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

	const { primary } = useStatsLocations( statsParams );

	const isLoading = primary.isLoading || primary.isFetching;
	const isError = primary.isError;
	const report = primary.data as StatsNormalizedReport< StatsLocationsItem > | undefined;
	const rawItems = report?.data?.[ 0 ]?.items ?? [];
	const items = rawItems
		.map( toLocationView )
		.filter( ( v ): v is LocationView => v !== null )
		.slice( 0, max || undefined );

	if ( ! isLoading && ! isError && items.length === 0 ) {
		return {
			data: max ? SAMPLE_LOCATIONS.slice( 0, max ) : SAMPLE_LOCATIONS,
			isLoading: false,
			isError: false,
			isSample: true,
		};
	}

	return {
		data: items,
		isLoading,
		isError,
		isSample: false,
	};
}
