/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useState, useEffect } from '@wordpress/element';

/**
 * A single normalized country-views row, the shape the widget renders from.
 *
 * Mirrors the relevant fields of Calypso's `normalizers.statsCountryViews`
 * output (country branch only).
 */
export interface LocationView {
	label: string;
	countryCode: string;
	countryFull: string;
	value: number;
	region: string;
}

/**
 * Raw shape of the wpcom `country-views` response, as proxied by stats-admin.
 * Only the fields the country-level normalizer reads are typed.
 */
interface RawCountryViews {
	'country-info'?: Record< string, { country_full?: string; map_region?: string } >;
	summary?: {
		views?: Array< { country_code: string; location?: string; views: number } >;
	};
}

/**
 * Date-range presets the widget exposes. Each maps to a trailing window of
 * N days, summarized server-side (`period=day` + `num=N` + `summarize`).
 */
export type RangeKey = 'today' | 'last-7-days' | 'last-30-days' | 'last-year';

const RANGE_DAYS: Record< RangeKey, number > = {
	today: 1,
	'last-7-days': 7,
	'last-30-days': 30,
	'last-year': 365,
};

const DEFAULT_RANGE: RangeKey = 'last-30-days';

interface UseLocationViewsArgs {
	range: RangeKey;
	max: number;
}

interface LocationViewsState {
	data: LocationView[];
	isLoading: boolean;
	isError: boolean;
	/**
	 * True when the data is the bundled placeholder rather than live stats —
	 * shown when the blog id isn't available (site not connected) or the
	 * request failed.
	 */
	isSample: boolean;
}

/**
 * Country-level placeholder data, shown when live stats aren't available.
 * Lets the widget render in the dashboard preview without a connected site.
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

// Locations the legacy geoviews table can't resolve; dropped, as in Calypso.
const UNKNOWN_COUNTRY_CODES = [ 'A1', 'A2', 'ZZ' ];

/**
 * Read the WordPress.com blog id exposed on the page.
 *
 * Uses the Odyssey `window.configData.blog_id` convention; the package's
 * `src/stats-config.php` inlines it on the dashboard page. Absent when the
 * site isn't connected.
 *
 * @return The numeric blog id, or undefined when not available.
 */
function getBlogId(): number | undefined {
	const configData = ( window as unknown as { configData?: { blog_id?: unknown } } ).configData;
	const blogId = configData?.blog_id;
	return typeof blogId === 'number' ? blogId : undefined;
}

/**
 * Normalize a raw `country-views` (summarized) response into the rows the
 * widget renders. Port of Calypso's `statsCountryViews` normalizer, summary
 * branch + country mode only.
 *
 * @param data - Raw response from the stats endpoint.
 * @param max  - Maximum number of rows to keep (0 means all).
 * @return Normalized, ranked country rows.
 */
export function normalizeCountryViews(
	data: RawCountryViews | undefined,
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
			// ’ in country names breaks the geo visualization, so normalize it.
			label: view.location || info.country_full.replace( /’/g, "'" ),
			countryCode: view.country_code,
			countryFull: info.country_full,
			value: view.views,
			region: info.map_region ?? '',
		} );
	}

	return max ? rows.slice( 0, max ) : rows;
}

/**
 * Fetch country-level location views for the dashboard widget.
 *
 * Calls the stats-admin proxy route
 * `/jetpack/v4/stats-app/sites/{blogId}/stats/country-views`, which forwards to
 * the wpcom `country-views` endpoint. The range preset maps to a trailing
 * window of N days summarized server-side; `date` is intentionally omitted so
 * the endpoint anchors the window to "today" in the site's own timezone.
 * Falls back to bundled sample data when the blog id isn't available or the
 * request fails.
 *
 * @param args       - Hook arguments.
 * @param args.range - Date-range preset, e.g. `last-30-days`.
 * @param args.max   - Maximum number of countries to return.
 * @return The current data/loading/error state.
 */
export default function useLocationViews( {
	range,
	max,
}: UseLocationViewsArgs ): LocationViewsState {
	const [ state, setState ] = useState< LocationViewsState >( {
		data: [],
		isLoading: true,
		isError: false,
		isSample: false,
	} );

	useEffect( () => {
		const blogId = getBlogId();

		// Without a blog id there's no live data source — render sample data so
		// the widget is still demoable.
		if ( ! blogId ) {
			setState( {
				data: SAMPLE_LOCATIONS.slice( 0, max ),
				isLoading: false,
				isError: false,
				isSample: true,
			} );
			return;
		}

		let cancelled = false;
		setState( prev => ( { ...prev, isLoading: true } ) );

		const params = new URLSearchParams( {
			period: 'day',
			num: String( RANGE_DAYS[ range ] ?? RANGE_DAYS[ DEFAULT_RANGE ] ),
			summarize: '1',
			max: String( max ),
		} );
		const path = `/jetpack/v4/stats-app/sites/${ blogId }/stats/country-views?${ params.toString() }`;

		apiFetch< RawCountryViews >( { path } )
			.then( response => {
				if ( cancelled ) {
					return;
				}
				setState( {
					data: normalizeCountryViews( response, max ),
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
	}, [ range, max ] );

	return state;
}
