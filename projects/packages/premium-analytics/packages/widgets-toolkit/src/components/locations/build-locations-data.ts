/**
 * Internal dependencies
 */
import { flagUrl } from '../../helpers/flag-url';
import type { LeaderboardRowInput } from '../leaderboard/build-leaderboard-chart-data';
import type {
	LocationsGeoFocusCountry,
	LocationsGeoMode,
	LocationsGeoRow,
} from '../locations-geo-chart';

/**
 * One location of the ranking, in the widget's own terms.
 */
export type LocationRowInput = {
	/**
	 * ISO country code on the world map; the region's name inside a country.
	 */
	id: string;
	label: string;
	/**
	 * Figure for the selected period.
	 */
	value: number;
	/**
	 * Figure for the comparison period; `undefined` when the location has no match there.
	 */
	previousValue?: number;
};

/**
 * The country the rows belong to, when they are its regions rather than countries.
 */
export type LocationsCountry = LocationsGeoFocusCountry;

type LocationsDataOptions = {
	/**
	 * The country the rows are regions of; omit for countries on the world map.
	 */
	country?: LocationsCountry;
	/**
	 * Whether the comparison period is on.
	 */
	hasComparison: boolean;
	/**
	 * Rows the list shows: a previous figure past them does not turn the comparison on.
	 */
	maxRows: number;
};

type LocationsDataResult = {
	geoRows: LocationsGeoRow[];
	geoMode: LocationsGeoMode;
	focusCountry?: LocationsCountry;
	/**
	 * The ranking as the leaderboard builder takes it, a flag on every row.
	 */
	rows: LeaderboardRowInput[];
	/**
	 * Whether the comparison period is on and at least one visible row carries a previous figure.
	 */
	comparing: boolean;
};

/**
 * Turns the ranking into the map's rows and the leaderboard's rows: countries on the world
 * map, or the regions of one country, each row carrying the matching flag.
 *
 * @param rows    - The ranking, in display order.
 * @param options - The country the rows belong to, if any, the comparison flag and the visible row count.
 * @return The map rows, the leaderboard rows and the comparison flag.
 */
export function buildLocationsData(
	rows: readonly LocationRowInput[],
	options: LocationsDataOptions
): LocationsDataResult {
	const { country, hasComparison, maxRows } = options;

	return {
		geoRows: rows.map( row => ( {
			label: row.label,
			value: row.value,
			countryCode: country ? country.code : row.id.toUpperCase(),
			countryFull: country ? country.name : row.label,
		} ) ),
		geoMode: country ? 'region' : 'country',
		focusCountry: country,
		rows: rows.map( row => ( {
			id: row.id,
			label: row.label,
			value: row.value,
			previousValue: row.previousValue,
			media: {
				kind: 'flag',
				url: flagUrl( ( country ? country.code : row.id ).toLowerCase() ) ?? undefined,
				country: country ? country.name : row.label,
			},
		} ) ),
		comparing:
			hasComparison && rows.slice( 0, maxRows ).some( row => row.previousValue !== undefined ),
	};
}
