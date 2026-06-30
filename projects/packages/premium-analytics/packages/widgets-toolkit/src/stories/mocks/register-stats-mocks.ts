/**
 * Stats API mock middleware for Storybook.
 *
 * Intercepts `@wordpress/api-fetch` requests to the PA Stats proxy and returns
 * static fixture data so Stats-backed widgets render in Storybook without a
 * live WordPress and WPCOM connection.
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

function getStatsMock( path: string ): unknown | null {
	const subPath = path.slice( STATS_BASE.length ).split( '?' )[ 0 ];
	const isComparison = isComparisonRequest( path );

	if ( subPath.startsWith( '/clicks' ) ) {
		return isComparison ? MOCK_CLICKS_COMPARISON : MOCK_CLICKS;
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

	return prepareStatsMockResponse( { days: {}, summary: {} }, options.parse );
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
