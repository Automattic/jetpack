/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useState, useEffect } from '@wordpress/element';

/**
 * A single normalized location-views row.
 *
 * Mirrors the relevant fields of Calypso's `normalizers.statsCountryViews` output.
 * In country mode: label is the country name, countryCode is the ISO code.
 * In region mode: label is the region name, countryCode is still the parent country code.
 */
export interface LocationView {
	label: string;
	countryCode: string;
	countryFull: string;
	value: number;
	region: string;
}

/**
 * Raw shape of the wpcom location-views / country-views response,
 * as proxied by the PA data proxy. Only the summarized branch is used.
 */
interface RawLocationViews {
	'country-info'?: Record< string, { country_full?: string; map_region?: string } >;
	summary?: {
		views?: Array< { country_code: string; location?: string; views: number } >;
	};
}

export type GeoMode = 'country' | 'region';

const DEFAULT_NUM = 30;

interface UseLocationViewsArgs {
	num: number;
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

/**
 * Country-level placeholder data shown when the site isn't connected or the request fails.
 */
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

const UNKNOWN_COUNTRY_CODES = [ 'A1', 'A2', 'ZZ' ];

/**
 * Build the PA data-proxy path for a location-views or country-views request.
 *
 * Uses `/jetpack-premium-analytics/v1/proxy/v1.1/stats/<endpoint>` — the PA proxy
 * injects the connected blog id server-side so the client never needs to know it.
 *
 * @param geoMode       - 'country' uses the legacy country-views endpoint;
 *                      'region' uses location-views/region.
 * @param num           - Trailing window in days.
 * @param max           - Maximum rows to return.
 * @param countryFilter - ISO country code to filter regions by (region mode only).
 * @return The full apiFetch path.
 */
function buildPath( geoMode: GeoMode, num: number, max: number, countryFilter?: string ): string {
	const endpoint = geoMode === 'region' ? 'location-views/region' : 'country-views';

	const params = new URLSearchParams( {
		period: 'day',
		num: String( num > 0 ? num : DEFAULT_NUM ),
		summarize: '1',
		max: String( max ),
	} );

	if ( geoMode === 'region' && countryFilter ) {
		params.set( 'filter_by_country', countryFilter );
	}

	return `/jetpack-premium-analytics/v1/proxy/v1.1/stats/${ endpoint }?${ params.toString() }`;
}

/**
 * Normalize a raw location-views / country-views (summarized) response.
 *
 * Port of Calypso's `statsCountryViews` normalizer, summary branch.
 *
 * @param data - Raw response from the proxy.
 * @param max  - Maximum rows to keep (0 = all).
 * @return Normalized rows, ranked by view count descending.
 */
export function normalizeLocationViews(
	data: RawLocationViews | undefined,
	max: number
): LocationView[] {
	if ( ! data ) {
		return [];
	}

	const countryInfo = data[ 'country-info' ] ?? {};
	const views = data.summary?.views ?? [];
	const rows: LocationView[] = [];

	for ( const view of views ) {
		if ( UNKNOWN_COUNTRY_CODES.includes( view.country_code ) ) {
			continue;
		}

		const info = countryInfo[ view.country_code ];
		if ( ! info || ! info.country_full ) {
			continue;
		}

		rows.push( {
			// Apostrophes in names break the Google GeoChart visualization.
			label: view.location || info.country_full.replace( /'/g, "'" ),
			countryCode: view.country_code,
			countryFull: info.country_full,
			value: view.views,
			region: info.map_region ?? '',
		} );
	}

	return max ? rows.slice( 0, max ) : rows;
}

/**
 * Fetch location views for the dashboard widget via the PA data proxy.
 *
 * The proxy (`/jetpack-premium-analytics/v1/proxy/v1.1/stats/...`) injects the
 * connected blog id server-side and forwards to the wpcom stats endpoint. Falls
 * back to bundled sample data on error (e.g. site not connected → 403).
 *
 * @param args               - Hook arguments.
 * @param args.num           - Trailing window in days (e.g. 30 for last-30-days).
 * @param args.max           - Maximum rows.
 * @param args.geoMode       - 'country' (default) or 'region'.
 * @param args.countryFilter - ISO country code to filter regions by (region mode).
 * @return The current data/loading/error state.
 */
export default function useLocationViews( {
	num,
	max,
	geoMode = 'country',
	countryFilter,
}: UseLocationViewsArgs ): LocationViewsState {
	const [ state, setState ] = useState< LocationViewsState >( {
		data: [],
		isLoading: true,
		isError: false,
		isSample: false,
	} );

	useEffect( () => {
		let cancelled = false;
		setState( prev => ( { ...prev, isLoading: true } ) );

		const path = buildPath( geoMode, num, max, countryFilter );

		apiFetch< RawLocationViews >( { path } )
			.then( response => {
				if ( cancelled ) {
					return;
				}
				setState( {
					data: normalizeLocationViews( response, max ),
					isLoading: false,
					isError: false,
					isSample: false,
				} );
			} )
			.catch( () => {
				if ( cancelled ) {
					return;
				}
				setState( {
					data: SAMPLE_LOCATIONS.slice( 0, max ),
					isLoading: false,
					isError: true,
					isSample: true,
				} );
			} );

		return () => {
			cancelled = true;
		};
	}, [ geoMode, num, max, countryFilter ] );

	return state;
}
