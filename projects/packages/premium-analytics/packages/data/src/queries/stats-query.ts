import {
	fetchStatsProxy,
	type StatsProxyMethod,
	type StatsProxyParams,
	type StatsProxyVersion,
} from '../api';
import {
	sanitizeStatsClicksResponse,
	sanitizeStatsFileDownloadsResponse,
	sanitizeStatsLocationsResponse,
	sanitizeStatsArchivesResponse,
	sanitizeStatsVisitsResponse,
	sanitizeStatsPassthroughResponse,
	sanitizeStatsReferrersResponse,
	sanitizeStatsSearchTermsResponse,
	sanitizeStatsSiteResponse,
	sanitizeStatsTopAuthorsResponse,
	sanitizeStatsTopPostsResponse,
	sanitizeStatsVideoPlaysResponse,
} from '../processing/stats';
import {
	reportParamsToStatsQueryParams,
	statsQueryParamsToApiParams,
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
	archives: sanitizeStatsArchivesResponse,
	visits: sanitizeStatsVisitsResponse,
} satisfies Record< string, StatsSanitizer >;

export type StatsSanitizerKey = keyof typeof statsSanitizers;
type StatsSanitizerData< TSanitizer extends StatsSanitizerKey = StatsSanitizerKey > = ReturnType<
	( typeof statsSanitizers )[ TSanitizer ]
>;
export type StatsReportQueryOptions< TSanitizer extends StatsSanitizerKey = StatsSanitizerKey > =
	UseQueryOptions< StatsSanitizerData< TSanitizer > >;

export type StatsQueryConfig< TSanitizer extends StatsSanitizerKey = StatsSanitizerKey > = {
	name: string;
	version: StatsProxyVersion;
	endpoint: string;
	params?: StatsQueryParams;
	method?: StatsProxyMethod;
	body?: unknown;
	sanitizer?: TSanitizer;
	enabled?: boolean;
};

export function statsProxyQuery< TSanitizer extends StatsSanitizerKey >(
	config: StatsQueryConfig< TSanitizer > & { sanitizer: TSanitizer }
): StatsReportQueryOptions< TSanitizer >;
export function statsProxyQuery(
	config: StatsQueryConfig
): StatsReportQueryOptions< 'passthrough' >;
export function statsProxyQuery( config: StatsQueryConfig ): StatsReportQueryOptions {
	const { name, version, endpoint, params, method = 'GET', body, enabled = true } = config;
	const sanitizer = config.sanitizer ?? 'passthrough';
	const apiParams = statsQueryParamsToApiParams( params );

	return {
		queryKey: [ 'stats', name, version, endpoint, method, apiParams, body, sanitizer ],
		queryFn: async () => {
			const response = await fetchStatsProxy( {
				version,
				endpoint,
				params: apiParams,
				method,
				body,
			} );
			return statsSanitizers[ sanitizer ]( response, apiParams );
		},
		enabled,
		placeholderData: previousData => previousData,
	};
}

export function statsReportQuery< TSanitizer extends StatsSanitizerKey >(
	name: string,
	endpoint: string,
	params: StatsReportParams,
	sanitizer: TSanitizer,
	version: StatsProxyVersion = '1.1',
	// Endpoint-specific params that should reach the API but are not in the
	// reportParamsToStatsQueryParams allow-list (e.g. filter_by_country).
	extraParams?: StatsProxyParams
): StatsReportQueryOptions< TSanitizer > {
	const statsParams = reportParamsToStatsQueryParams( params );
	const reportParams = {
		...statsParams,
		...extraParams,
		...( statsParams.summarize === undefined &&
		typeof statsParams.days === 'number' &&
		statsParams.days > 1
			? { summarize: 1 }
			: {} ),
	};

	return statsProxyQuery( {
		name,
		version,
		endpoint,
		params: reportParams,
		sanitizer,
		enabled: !! ( reportParams.end_date || reportParams.date || reportParams.start_date ),
	} );
}
