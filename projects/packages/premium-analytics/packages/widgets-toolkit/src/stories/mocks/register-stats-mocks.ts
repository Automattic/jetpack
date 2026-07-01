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

const MOCK_CLICKS = {
	date: '2026-06-29',
	period: 'day',
	days: {},
	summary: {
		clicks: [
			{
				name: 'wordpress.org',
				views: 3840,
				icon: 'https://www.google.com/s2/favicons?domain=wordpress.org&sz=32',
				children: [
					{
						name: 'wordpress.org/plugins/jetpack-search',
						views: 2410,
						url: 'https://wordpress.org/plugins/jetpack-search',
					},
					{
						name: 'wordpress.org/plugins/jetpack-boost/',
						views: 1430,
						url: 'https://wordpress.org/plugins/jetpack-boost/',
					},
				],
			},
			{
				name: 'developer.wordpress.org',
				views: 2610,
				icon: 'https://www.google.com/s2/favicons?domain=developer.wordpress.org&sz=32',
				children: [
					{
						name: 'developer.wordpress.org/reference/functions/wp_remote_get',
						views: 1180,
						url: 'https://developer.wordpress.org/reference/functions/wp_remote_get/',
					},
					{
						name: 'developer.wordpress.org/rest-api/reference',
						views: 840,
						url: 'https://developer.wordpress.org/rest-api/reference/',
					},
					{
						name: 'developer.wordpress.org/block-editor/reference-guides',
						views: 590,
						url: 'https://developer.wordpress.org/block-editor/reference-guides/',
					},
				],
			},
			{
				name: 'jetpack.com',
				views: 1920,
				icon: 'https://www.google.com/s2/favicons?domain=jetpack.com&sz=32',
				children: [
					{
						name: 'jetpack.com/support',
						views: 910,
						url: 'https://jetpack.com/support/',
					},
					{
						name: 'jetpack.com/blog',
						views: 640,
						url: 'https://jetpack.com/blog/',
					},
					{
						name: 'jetpack.com/pricing',
						views: 370,
						url: 'https://jetpack.com/pricing/',
					},
				],
			},
			{
				name: 'woocommerce.com',
				views: 1305,
				icon: 'https://www.google.com/s2/favicons?domain=woocommerce.com&sz=32',
				children: [
					{
						name: 'woocommerce.com/documentation/plugins',
						views: 610,
						url: 'https://woocommerce.com/documentation/plugins/',
					},
					{
						name: 'woocommerce.com/products',
						views: 460,
						url: 'https://woocommerce.com/products/',
					},
					{
						name: 'woocommerce.com/posts',
						views: 235,
						url: 'https://woocommerce.com/posts/',
					},
				],
			},
			{
				name: 'example.com',
				views: 870,
				children: [
					{
						name: 'example.com/downloads/whitepaper.pdf',
						views: 530,
						url: 'https://example.com/downloads/whitepaper.pdf',
					},
					{
						name: 'example.com/demo',
						views: 340,
						url: 'https://example.com/demo/',
					},
				],
			},
		],
	},
};

const MOCK_CLICKS_COMPARISON = {
	date: '2026-05-30',
	period: 'day',
	days: {},
	summary: {
		clicks: [
			{
				name: 'wordpress.org',
				views: 3100,
				icon: 'https://www.google.com/s2/favicons?domain=wordpress.org&sz=32',
				children: [
					{
						name: 'wordpress.org/plugins/jetpack-search',
						views: 1980,
						url: 'https://wordpress.org/plugins/jetpack-search',
					},
					{
						name: 'wordpress.org/plugins/jetpack-boost/',
						views: 1120,
						url: 'https://wordpress.org/plugins/jetpack-boost/',
					},
				],
			},
			{
				name: 'developer.wordpress.org',
				views: 2940,
				icon: 'https://www.google.com/s2/favicons?domain=developer.wordpress.org&sz=32',
				children: [
					{
						name: 'developer.wordpress.org/reference/functions/wp_remote_get',
						views: 1410,
						url: 'https://developer.wordpress.org/reference/functions/wp_remote_get/',
					},
					{
						name: 'developer.wordpress.org/rest-api/reference',
						views: 870,
						url: 'https://developer.wordpress.org/rest-api/reference/',
					},
					{
						name: 'developer.wordpress.org/block-editor/reference-guides',
						views: 660,
						url: 'https://developer.wordpress.org/block-editor/reference-guides/',
					},
				],
			},
			{
				name: 'jetpack.com',
				views: 1270,
				icon: 'https://www.google.com/s2/favicons?domain=jetpack.com&sz=32',
				children: [
					{
						name: 'jetpack.com/support',
						views: 620,
						url: 'https://jetpack.com/support/',
					},
					{
						name: 'jetpack.com/blog',
						views: 410,
						url: 'https://jetpack.com/blog/',
					},
					{
						name: 'jetpack.com/pricing',
						views: 240,
						url: 'https://jetpack.com/pricing/',
					},
				],
			},
			{
				name: 'woocommerce.com',
				views: 980,
				icon: 'https://www.google.com/s2/favicons?domain=woocommerce.com&sz=32',
				children: [
					{
						name: 'woocommerce.com/documentation/plugins',
						views: 460,
						url: 'https://woocommerce.com/documentation/plugins/',
					},
					{
						name: 'woocommerce.com/products',
						views: 330,
						url: 'https://woocommerce.com/products/',
					},
					{
						name: 'woocommerce.com/posts',
						views: 190,
						url: 'https://woocommerce.com/posts/',
					},
				],
			},
		],
	},
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
	const isComparison = isComparisonRequest( path );
	const locationViewsMatch = subPath.match( /^\/location-views\/(country|region|city)$/ );

	if ( subPath.startsWith( '/clicks' ) ) {
		return isComparison ? MOCK_CLICKS_COMPARISON : MOCK_CLICKS;
	}

	if ( locationViewsMatch ) {
		return buildStatsLocationViewsResponse(
			locationViewsMatch[ 1 ] as GeoMode,
			query,
			isComparison
		);
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
