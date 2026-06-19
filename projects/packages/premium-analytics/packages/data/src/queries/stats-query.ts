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
	statsQueryParamsToApiParams,
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

export type StatsSanitizerKey = keyof typeof statsSanitizers;

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
	const apiParams = statsQueryParamsToApiParams( params );

	return {
		queryKey: [
			'stats',
			name,
			version,
			endpoint,
			method,
			statsQueryKeyPart( apiParams ),
			statsQueryKeyPart( body ),
			sanitizer,
		],
		queryFn: async () => {
			const response = await fetchStatsProxy( {
				version,
				endpoint,
				params: apiParams,
				method,
				body,
			} );
			return statsSanitizers[ sanitizer ]( response, apiParams ) as TData;
		},
		enabled,
		placeholderData: previousData => previousData,
	};
}

export function statsReportQuery< TData = StatsNormalizedReport >(
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
		enabled: !! ( statsParams.end_date || statsParams.date || statsParams.start_date ),
	} );
}
