/**
 * Stats API mock middleware for Storybook.
 *
 * Intercepts `@wordpress/api-fetch` requests to the PA Stats proxy and returns
 * static fixture data so Stats-backed widgets render in Storybook without a
 * live WordPress + WPCOM connection.
 */
/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import type { APIFetchMiddleware, APIFetchOptions } from '@wordpress/api-fetch';

const STATS_BASE = '/jetpack-premium-analytics/v1/proxy/v1.1/stats';
const DAY_IN_MS = 24 * 60 * 60 * 1000;

const MOCK_FILE_DOWNLOADS_FILES = [
	{
		relative_url: '/annual-report-2025.pdf',
		filename: 'annual-report-2025.pdf',
		download_url: 'https://example.com/annual-report-2025.pdf',
		downloads: '3840',
	},
	{
		relative_url: '/product-brochure.pdf',
		filename: 'product-brochure.pdf',
		download_url: 'https://example.com/product-brochure.pdf',
		downloads: '2610',
	},
	{
		relative_url: '/getting-started-guide.pdf',
		filename: 'getting-started-guide.pdf',
		download_url: 'https://example.com/getting-started-guide.pdf',
		downloads: '1920',
	},
	{
		relative_url: '/press-release-q1.docx',
		filename: 'press-release-q1.docx',
		download_url: 'https://example.com/press-release-q1.docx',
		downloads: '1305',
	},
	{
		relative_url: '/logo-assets.zip',
		filename: 'logo-assets.zip',
		download_url: 'https://example.com/logo-assets.zip',
		downloads: '870',
	},
];

const MOCK_FILE_DOWNLOADS_COMPARISON_FILES = [
	{
		relative_url: '/annual-report-2025.pdf',
		filename: 'annual-report-2025.pdf',
		download_url: 'https://example.com/annual-report-2025.pdf',
		downloads: '3200',
	},
	{
		relative_url: '/product-brochure.pdf',
		filename: 'product-brochure.pdf',
		download_url: 'https://example.com/product-brochure.pdf',
		downloads: '2900',
	},
	{
		relative_url: '/getting-started-guide.pdf',
		filename: 'getting-started-guide.pdf',
		download_url: 'https://example.com/getting-started-guide.pdf',
		downloads: '1600',
	},
	{
		relative_url: '/press-release-q1.docx',
		filename: 'press-release-q1.docx',
		download_url: 'https://example.com/press-release-q1.docx',
		downloads: '1500',
	},
	{
		relative_url: '/logo-assets.zip',
		filename: 'logo-assets.zip',
		download_url: 'https://example.com/logo-assets.zip',
		downloads: '700',
	},
];

const MOCK_FILE_DOWNLOADS = {
	date: '2026-06-29',
	period: 'day',
	days: {
		'2026-06-29': {
			files: MOCK_FILE_DOWNLOADS_FILES,
			other_downloads: 0,
			total_downloads: 10545,
		},
	},
	summary: {
		files: MOCK_FILE_DOWNLOADS_FILES,
		other_downloads: 0,
		total_downloads: 10545,
	},
};

const MOCK_FILE_DOWNLOADS_COMPARISON = {
	date: '2026-05-30',
	period: 'day',
	days: {
		'2026-05-30': {
			files: MOCK_FILE_DOWNLOADS_COMPARISON_FILES,
			other_downloads: 0,
			total_downloads: 9900,
		},
	},
	summary: {
		files: MOCK_FILE_DOWNLOADS_COMPARISON_FILES,
		other_downloads: 0,
		total_downloads: 9900,
	},
};

function getStatsMock( path: string ): unknown | null {
	const subPath = path.slice( STATS_BASE.length ).split( '?' )[ 0 ];

	if ( subPath.startsWith( '/file-downloads' ) ) {
		return isComparisonRequest( path ) ? MOCK_FILE_DOWNLOADS_COMPARISON : MOCK_FILE_DOWNLOADS;
	}

	return null;
}

function getLocalDatePart( date: Date ) {
	const year = date.getFullYear();
	const month = String( date.getMonth() + 1 ).padStart( 2, '0' );
	const day = String( date.getDate() ).padStart( 2, '0' );

	return `${ year }-${ month }-${ day }`;
}

function isComparisonRequest( path: string ) {
	const query = path.split( '?' )[ 1 ];
	const date = query ? new URLSearchParams( query ).get( 'date' ) : null;

	if ( ! date ) {
		return false;
	}

	const today = getLocalDatePart( new Date() );
	const daysFromToday = Math.floor( ( Date.parse( today ) - Date.parse( date ) ) / DAY_IN_MS );

	return daysFromToday > 1;
}

const statsMocksMiddleware: APIFetchMiddleware = async ( options: APIFetchOptions, next ) => {
	const requestPath = options.path ?? options.url ?? '';

	if ( ! requestPath.startsWith( STATS_BASE ) ) {
		return next( options );
	}

	const mock = getStatsMock( requestPath );
	if ( mock !== null ) {
		return mock;
	}

	// Unknown Stats path — return empty-but-valid response.
	return { days: {} };
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
