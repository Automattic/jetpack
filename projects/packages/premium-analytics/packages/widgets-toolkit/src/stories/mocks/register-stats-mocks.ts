/**
 * Stats API mock middleware for Storybook.
 *
 * Intercepts `@wordpress/api-fetch` requests to the PA Stats proxy and returns
 * fixture data so Stats-backed widgets render in Storybook without a live
 * WordPress + WPCOM connection.
 */
/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import type { APIFetchMiddleware, APIFetchOptions } from '@wordpress/api-fetch';

const STATS_BASE = '/jetpack-premium-analytics/v1/proxy/v1.1/stats';
const DAY_IN_MS = 24 * 60 * 60 * 1000;

type UtmMock = {
	top_utm_values: Record< string, number >;
	top_posts: Record< string, unknown[] >;
};

function createUtmMock( topUtmValues: Record< string, number > ): UtmMock {
	return {
		top_utm_values: topUtmValues,
		top_posts: Object.fromEntries(
			Object.entries( topUtmValues ).map( ( [ key, value ], index ) => {
				const baseSlug = `utm-${ index + 1 }`;

				return [
					key,
					[
						{
							id: index * 2 + 1,
							title: `Landing page ${ index + 1 }`,
							views: Math.round( value * 0.6 ),
							href: `https://example.com/${ baseSlug }`,
						},
						{
							id: index * 2 + 2,
							title: `Signup page ${ index + 1 }`,
							views: Math.round( value * 0.3 ),
							href: `https://example.com/${ baseSlug }/signup`,
						},
					],
				];
			} )
		),
	};
}

// top_utm_values keys for multi-param endpoints are JSON-stringified arrays,
// matching the format the server returns and that sanitizeStatsUtmResponse parses.
const MOCK_UTM_SOURCE_MEDIUM = createUtmMock( {
	'["google","organic"]': 5200,
	'["twitter","social"]': 1800,
	'["newsletter","email"]': 950,
	'["facebook","paid"]': 720,
	'["bing","cpc"]': 380,
} );

const MOCK_UTM_SOURCE_MEDIUM_COMPARISON = createUtmMock( {
	'["google","organic"]': 4800,
	'["twitter","social"]': 2100,
	'["newsletter","email"]': 760,
	'["facebook","paid"]': 840,
	'["bing","cpc"]': 300,
} );

const MOCK_UTM_CAMPAIGN_SOURCE_MEDIUM = createUtmMock( {
	'["spring_sale","google","organic"]': 5200,
	'["newsletter_q2","newsletter","email"]': 1800,
	'["brand_awareness","twitter","social"]': 950,
	'["retargeting","facebook","paid"]': 720,
	'["product_launch","bing","cpc"]': 380,
} );

const MOCK_UTM_CAMPAIGN_SOURCE_MEDIUM_COMPARISON = createUtmMock( {
	'["spring_sale","google","organic"]': 4700,
	'["newsletter_q2","newsletter","email"]': 2100,
	'["brand_awareness","twitter","social"]': 780,
	'["retargeting","facebook","paid"]': 810,
	'["product_launch","bing","cpc"]': 330,
} );

const MOCK_UTM_SOURCE = createUtmMock( {
	google: 5200,
	twitter: 1800,
	newsletter: 950,
	facebook: 720,
	bing: 380,
} );

const MOCK_UTM_SOURCE_COMPARISON = createUtmMock( {
	google: 4800,
	twitter: 2100,
	newsletter: 760,
	facebook: 840,
	bing: 300,
} );

const MOCK_UTM_MEDIUM = createUtmMock( {
	organic: 5200,
	social: 1800,
	email: 950,
	paid: 720,
	cpc: 380,
} );

const MOCK_UTM_MEDIUM_COMPARISON = createUtmMock( {
	organic: 4800,
	social: 2100,
	email: 760,
	paid: 840,
	cpc: 300,
} );

const MOCK_UTM_CAMPAIGN = createUtmMock( {
	spring_sale: 5200,
	newsletter_q2: 1800,
	brand_awareness: 950,
	retargeting: 720,
	product_launch: 380,
} );

const MOCK_UTM_CAMPAIGN_COMPARISON = createUtmMock( {
	spring_sale: 4700,
	newsletter_q2: 2100,
	brand_awareness: 780,
	retargeting: 810,
	product_launch: 330,
} );

const UTM_MOCKS: Record< string, { primary: UtmMock; comparison: UtmMock } > = {
	'utm_source,utm_medium': {
		primary: MOCK_UTM_SOURCE_MEDIUM,
		comparison: MOCK_UTM_SOURCE_MEDIUM_COMPARISON,
	},
	'utm_campaign,utm_source,utm_medium': {
		primary: MOCK_UTM_CAMPAIGN_SOURCE_MEDIUM,
		comparison: MOCK_UTM_CAMPAIGN_SOURCE_MEDIUM_COMPARISON,
	},
	utm_source: { primary: MOCK_UTM_SOURCE, comparison: MOCK_UTM_SOURCE_COMPARISON },
	utm_medium: { primary: MOCK_UTM_MEDIUM, comparison: MOCK_UTM_MEDIUM_COMPARISON },
	utm_campaign: { primary: MOCK_UTM_CAMPAIGN, comparison: MOCK_UTM_CAMPAIGN_COMPARISON },
};

type GeoMode = 'country' | 'region' | 'city';

type StatsLocationItem = {
	location: string;
	views: number;
	country_code: string;
	coordinates?: {
		latitude: number;
		longitude: number;
	};
};

const COUNTRY_INFO = {
	US: { country_full: 'United States', map_region: '021' },
	GB: { country_full: 'United Kingdom', map_region: '154' },
	DE: { country_full: 'Germany', map_region: '155' },
	JP: { country_full: 'Japan', map_region: '030' },
	FR: { country_full: 'France', map_region: '155' },
	BR: { country_full: 'Brazil', map_region: '005' },
	IN: { country_full: 'India', map_region: '034' },
	AU: { country_full: 'Australia', map_region: '053' },
	CA: { country_full: 'Canada', map_region: '021' },
	MX: { country_full: 'Mexico', map_region: '013' },
	HK: { country_full: 'Hong Kong', map_region: '030' },
};

const COUNTRY_ROWS: StatsLocationItem[] = [
	{ location: 'United States', views: 8500, country_code: 'US' },
	{ location: 'United Kingdom', views: 4200, country_code: 'GB' },
	{ location: 'Germany', views: 3800, country_code: 'DE' },
	{ location: 'Japan', views: 3100, country_code: 'JP' },
	{ location: 'France', views: 2900, country_code: 'FR' },
	{ location: 'Brazil', views: 2400, country_code: 'BR' },
	{ location: 'India', views: 2200, country_code: 'IN' },
	{ location: 'Australia', views: 1800, country_code: 'AU' },
	{ location: 'Canada', views: 1650, country_code: 'CA' },
	{ location: 'Mexico', views: 1400, country_code: 'MX' },
];

const COUNTRY_COMPARISON_ROWS: StatsLocationItem[] = [
	{ location: 'United States', views: 7900, country_code: 'US' },
	{ location: 'United Kingdom', views: 4550, country_code: 'GB' },
	{ location: 'Germany', views: 3200, country_code: 'DE' },
	{ location: 'Japan', views: 2850, country_code: 'JP' },
	{ location: 'France', views: 3100, country_code: 'FR' },
	{ location: 'Brazil', views: 2100, country_code: 'BR' },
	{ location: 'India', views: 2500, country_code: 'IN' },
	{ location: 'Australia', views: 1700, country_code: 'AU' },
	{ location: 'Canada', views: 1800, country_code: 'CA' },
	{ location: 'Mexico', views: 1220, country_code: 'MX' },
];

const CITY_ROWS: StatsLocationItem[] = [
	{
		location: 'North Bergen',
		views: 2716,
		country_code: 'US',
		coordinates: { latitude: 40.8043, longitude: -74.0121 },
	},
	{
		location: 'Hong Kong',
		views: 1246,
		country_code: 'HK',
		coordinates: { latitude: 22.3193, longitude: 114.1694 },
	},
	{
		location: 'London',
		views: 476,
		country_code: 'GB',
		coordinates: { latitude: 51.5072, longitude: -0.1276 },
	},
	{
		location: 'Tokyo',
		views: 390,
		country_code: 'JP',
		coordinates: { latitude: 35.6762, longitude: 139.6503 },
	},
	{
		location: 'Berlin',
		views: 330,
		country_code: 'DE',
		coordinates: { latitude: 52.52, longitude: 13.405 },
	},
];

const CITY_COMPARISON_ROWS: StatsLocationItem[] = [
	{
		location: 'North Bergen',
		views: 2400,
		country_code: 'US',
		coordinates: { latitude: 40.8043, longitude: -74.0121 },
	},
	{
		location: 'Hong Kong',
		views: 1380,
		country_code: 'HK',
		coordinates: { latitude: 22.3193, longitude: 114.1694 },
	},
	{
		location: 'London',
		views: 520,
		country_code: 'GB',
		coordinates: { latitude: 51.5072, longitude: -0.1276 },
	},
	{
		location: 'Tokyo',
		views: 340,
		country_code: 'JP',
		coordinates: { latitude: 35.6762, longitude: 139.6503 },
	},
	{
		location: 'Berlin',
		views: 370,
		country_code: 'DE',
		coordinates: { latitude: 52.52, longitude: 13.405 },
	},
];

const REGION_ROWS_BY_COUNTRY: Record< string, StatsLocationItem[] > = {
	US: [
		{ location: 'California', views: 1800, country_code: 'US' },
		{ location: 'New York', views: 1280, country_code: 'US' },
		{ location: 'Texas', views: 1090, country_code: 'US' },
		{ location: 'Florida', views: 920, country_code: 'US' },
		{ location: 'Illinois', views: 640, country_code: 'US' },
	],
	GB: [
		{ location: 'England', views: 2100, country_code: 'GB' },
		{ location: 'Scotland', views: 760, country_code: 'GB' },
		{ location: 'Wales', views: 420, country_code: 'GB' },
		{ location: 'Northern Ireland', views: 280, country_code: 'GB' },
	],
	DE: [
		{ location: 'North Rhine-Westphalia', views: 980, country_code: 'DE' },
		{ location: 'Bavaria', views: 820, country_code: 'DE' },
		{ location: 'Berlin', views: 610, country_code: 'DE' },
		{ location: 'Hesse', views: 460, country_code: 'DE' },
	],
};

const REGION_COMPARISON_ROWS_BY_COUNTRY: Record< string, StatsLocationItem[] > = {
	US: [
		{ location: 'California', views: 1620, country_code: 'US' },
		{ location: 'New York', views: 1400, country_code: 'US' },
		{ location: 'Texas', views: 970, country_code: 'US' },
		{ location: 'Florida', views: 880, country_code: 'US' },
		{ location: 'Illinois', views: 720, country_code: 'US' },
	],
	GB: [
		{ location: 'England', views: 2200, country_code: 'GB' },
		{ location: 'Scotland', views: 690, country_code: 'GB' },
		{ location: 'Wales', views: 450, country_code: 'GB' },
		{ location: 'Northern Ireland', views: 240, country_code: 'GB' },
	],
	DE: [
		{ location: 'North Rhine-Westphalia', views: 900, country_code: 'DE' },
		{ location: 'Bavaria', views: 870, country_code: 'DE' },
		{ location: 'Berlin', views: 540, country_code: 'DE' },
		{ location: 'Hesse', views: 500, country_code: 'DE' },
	],
};

// Heuristic: a request whose `date` param is more than 1 day ago is treated as the
// comparison-period request. This works for the default `last-30-days` preset (primary
// date ≈ today, comparison date ≈ 30 days ago). It would misclassify a `today` preset
// (comparison date = yesterday, daysFromToday === 1), but the stories only use the default
// preset so this is fine in practice.
function isComparisonRequest( path: string ): boolean {
	const queryString = path.split( '?' )[ 1 ];
	const requestDate = queryString ? new URLSearchParams( queryString ).get( 'date' ) : null;

	if ( ! requestDate ) {
		return false;
	}

	const today = new Date().toISOString().slice( 0, 10 );
	const daysFromToday = Math.floor(
		( Date.parse( today ) - Date.parse( requestDate ) ) / DAY_IN_MS
	);

	return daysFromToday > 1;
}

function getRequestDate( query: URLSearchParams ) {
	return query.get( 'date' ) || new Date().toISOString().slice( 0, 10 );
}

function getLocationRows(
	geoMode: GeoMode,
	query: URLSearchParams,
	isComparison: boolean
): StatsLocationItem[] {
	if ( geoMode === 'city' ) {
		return isComparison ? CITY_COMPARISON_ROWS : CITY_ROWS;
	}

	if ( geoMode === 'region' ) {
		const countryCode = query.get( 'filter_by_country' ) || 'US';
		const regionRows = isComparison ? REGION_COMPARISON_ROWS_BY_COUNTRY : REGION_ROWS_BY_COUNTRY;

		return regionRows[ countryCode ] ?? regionRows.US;
	}

	return isComparison ? COUNTRY_COMPARISON_ROWS : COUNTRY_ROWS;
}

function buildStatsLocationViewsResponse(
	geoMode: GeoMode,
	query: URLSearchParams,
	isComparison: boolean
) {
	const rows = getLocationRows( geoMode, query, isComparison );
	const date = getRequestDate( query );
	const totalViews = rows.reduce( ( sum, item ) => sum + item.views, 0 );

	return {
		date,
		period: query.get( 'period' ) || 'day',
		'country-info': COUNTRY_INFO,
		summary: {
			views: rows,
			other_views: 0,
			total_views: totalViews,
		},
		days: {
			[ date ]: {
				views: rows,
				other_views: 0,
				total_views: totalViews,
			},
		},
	};
}

function getStatsMock( path: string ): unknown | null {
	const withoutBase = path.slice( STATS_BASE.length );
	const queryIndex = withoutBase.indexOf( '?' );
	const subPath = queryIndex === -1 ? withoutBase : withoutBase.slice( 0, queryIndex );
	const query = new URLSearchParams( queryIndex === -1 ? '' : withoutBase.slice( queryIndex + 1 ) );
	const locationViewsMatch = subPath.match( /^\/location-views\/(country|region|city)$/ );

	if ( locationViewsMatch ) {
		return buildStatsLocationViewsResponse(
			locationViewsMatch[ 1 ] as GeoMode,
			query,
			isComparisonRequest( path )
		);
	}

	// /stats/utm/{utmParam} — strip leading slash and match against known params.
	if ( subPath.startsWith( '/utm/' ) ) {
		const utmParam = subPath.slice( '/utm/'.length );
		const mock = UTM_MOCKS[ utmParam ];

		if ( mock ) {
			return isComparisonRequest( path ) ? mock.comparison : mock.primary;
		}

		return { top_utm_values: {}, top_posts: {} };
	}

	return null;
}

function prepareStatsMockResponse( mock: unknown, parse?: boolean ) {
	if ( parse === false ) {
		return new Response( JSON.stringify( mock ), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		} );
	}

	return mock;
}

const statsMocksMiddleware: APIFetchMiddleware = async ( options: APIFetchOptions, next ) => {
	const requestPath = options.path ?? options.url ?? '';

	if ( ! requestPath.startsWith( STATS_BASE ) ) {
		return next( options );
	}

	const mock = getStatsMock( requestPath );

	if ( mock !== null ) {
		return prepareStatsMockResponse( mock, options.parse );
	}

	return prepareStatsMockResponse( { data: [], summary: {} }, options.parse );
};

let registered = false;

/**
 * Registers the Stats API mock middleware. Idempotent.
 */
export function registerStatsMocks(): void {
	if ( registered ) {
		return;
	}
	registered = true;
	apiFetch.use( statsMocksMiddleware );
}
