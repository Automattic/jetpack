/**
 * External dependencies
 */

/**
 * Internal dependencies
 */
import { fetchStatsProxy, type StatsProxyMethod, type StatsProxyVersion } from '../api';
import {
	sanitizeStatsClicksResponse,
	sanitizeStatsFileDownloadsResponse,
	sanitizeStatsLocationsResponse,
	sanitizeStatsPassthroughResponse,
	sanitizeStatsReferrersResponse,
	sanitizeStatsSearchTermsResponse,
	sanitizeStatsSiteResponse,
	sanitizeStatsTopAuthorsResponse,
	sanitizeStatsTopPostsResponse,
	sanitizeStatsVideoPlaysResponse,
	type StatsNormalizedReport,
} from '../processing/stats';
import {
	reportParamsToStatsQueryParams,
	statsQueryKeyPart,
	type StatsQueryParams,
} from '../utils/stats-params';
import type { ReportParams } from '../utils/search';
import type { UseQueryOptions } from '@tanstack/react-query';

export type StatsReportParams = ReportParams & StatsQueryParams;
type StatsSanitizer< TData = unknown > = ( response: unknown, params?: StatsQueryParams ) => TData;

const statsSanitizers = {
	passthrough: sanitizeStatsPassthroughResponse,
	site: sanitizeStatsSiteResponse,
	topPosts: sanitizeStatsTopPostsResponse,
	referrers: sanitizeStatsReferrersResponse,
	clicks: sanitizeStatsClicksResponse,
	searchTerms: sanitizeStatsSearchTermsResponse,
	fileDownloads: sanitizeStatsFileDownloadsResponse,
	topAuthors: sanitizeStatsTopAuthorsResponse,
	locations: sanitizeStatsLocationsResponse,
	videoPlays: sanitizeStatsVideoPlaysResponse,
} satisfies Record< string, StatsSanitizer >;

type StatsSanitizerKey = keyof typeof statsSanitizers;

export type StatsQueryConfig = {
	name: string;
	version: StatsProxyVersion;
	endpoint: string;
	params?: StatsQueryParams;
	method?: StatsProxyMethod;
	body?: unknown;
	sanitizer?: StatsSanitizerKey;
	enabled?: boolean;
};

export function statsProxyQuery< TData = unknown >( {
	name,
	version,
	endpoint,
	params,
	method = 'GET',
	body,
	sanitizer = 'passthrough',
	enabled = true,
}: StatsQueryConfig ): UseQueryOptions< TData > {
	return {
		queryKey: [
			'stats',
			name,
			version,
			endpoint,
			method,
			statsQueryKeyPart( params ),
			statsQueryKeyPart( body ),
			sanitizer,
		],
		queryFn: async () => {
			const response = await fetchStatsProxy( { version, endpoint, params, method, body } );
			return statsSanitizers[ sanitizer ]( response, params ) as TData;
		},
		enabled,
		placeholderData: previousData => previousData,
	};
}

function statsReportQuery< TData = StatsNormalizedReport >(
	name: string,
	endpoint: string,
	params: StatsReportParams,
	sanitizer: StatsSanitizerKey,
	version: StatsProxyVersion = '1.1'
): UseQueryOptions< TData > {
	const statsParams = reportParamsToStatsQueryParams( params );

	return statsProxyQuery( {
		name,
		version,
		endpoint,
		params: statsParams,
		sanitizer,
		enabled: !! ( statsParams.date || statsParams.start_date || params.from || params.to ),
	} );
}

export const statsSiteQuery = ( params: StatsQueryParams = {} ) =>
	statsProxyQuery( {
		name: 'site',
		version: '1.1',
		endpoint: 'stats',
		params,
		sanitizer: 'site',
	} );

export const statsTopPostsQuery = ( params: StatsReportParams ) =>
	statsReportQuery( 'top-posts', 'stats/top-posts', params, 'topPosts' );

export const statsReferrersQuery = ( params: StatsReportParams ) =>
	statsReportQuery( 'referrers', 'stats/referrers', params, 'referrers' );

export const statsClicksQuery = ( params: StatsReportParams ) =>
	statsReportQuery( 'clicks', 'stats/clicks', params, 'clicks' );

export const statsSearchTermsQuery = ( params: StatsReportParams ) =>
	statsReportQuery( 'search-terms', 'stats/search-terms', params, 'searchTerms' );

export const statsFileDownloadsQuery = ( params: StatsReportParams ) =>
	statsReportQuery( 'file-downloads', 'stats/file-downloads', params, 'fileDownloads' );

export const statsTopAuthorsQuery = ( params: StatsReportParams ) =>
	statsReportQuery( 'top-authors', 'stats/top-authors', params, 'topAuthors' );

export const statsLocationsQuery = (
	params: StatsReportParams & { geoMode?: 'country' | 'region' | 'city' }
) => {
	const geoMode = params.geoMode ?? 'country';

	return statsReportQuery(
		`locations-${ geoMode }`,
		`stats/location-views/${ geoMode }`,
		params,
		'locations'
	);
};

export const statsCountryViewsQuery = ( params: StatsReportParams ) =>
	statsReportQuery( 'country-views', 'stats/country-views', params, 'locations' );

export const statsVideoPlaysQuery = ( params: StatsReportParams ) =>
	statsReportQuery( 'video-plays', 'stats/video-plays', params, 'videoPlays' );
