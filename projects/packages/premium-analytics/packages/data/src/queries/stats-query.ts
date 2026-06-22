import { fetchStatsProxy, type StatsProxyMethod, type StatsProxyVersion } from '../api';
import {
	sanitizeStatsClicksResponse,
	sanitizeStatsFileDownloadsResponse,
	sanitizeStatsLocationsResponse,
	sanitizeStatsArchivesResponse,
	sanitizeStatsCommentFollowersResponse,
	sanitizeStatsCommentsResponse,
	sanitizeStatsDevicesResponse,
	sanitizeStatsEmailBreakdownResponse,
	sanitizeStatsEmailSummaryResponse,
	sanitizeStatsFollowersResponse,
	sanitizeStatsPassthroughResponse,
	sanitizeStatsPublicizeResponse,
	sanitizeStatsReferrersResponse,
	sanitizeStatsSearchTermsResponse,
	sanitizeStatsSiteResponse,
	sanitizeStatsTagsResponse,
	sanitizeStatsTimeSeriesResponse,
	sanitizeStatsTopAuthorsResponse,
	sanitizeStatsTopPostsResponse,
	sanitizeStatsVisitsResponse,
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
	visits: sanitizeStatsVisitsResponse,
	timeSeries: sanitizeStatsTimeSeriesResponse,
	devices: sanitizeStatsDevicesResponse,
	archives: sanitizeStatsArchivesResponse,
	publicize: sanitizeStatsPublicizeResponse,
	followers: sanitizeStatsFollowersResponse,
	tags: sanitizeStatsTagsResponse,
	comments: sanitizeStatsCommentsResponse,
	commentFollowers: sanitizeStatsCommentFollowersResponse,
	emailSummary: sanitizeStatsEmailSummaryResponse,
	emailBreakdown: sanitizeStatsEmailBreakdownResponse,
} satisfies Record< string, StatsSanitizer >;

export type StatsSanitizerKey = keyof typeof statsSanitizers;
type StatsSanitizerData = ReturnType< ( typeof statsSanitizers )[ StatsSanitizerKey ] >;

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

export function statsProxyQuery( config: StatsQueryConfig ): UseQueryOptions< StatsSanitizerData > {
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

export function statsReportQuery(
	name: string,
	endpoint: string,
	params: StatsReportParams,
	sanitizer: StatsSanitizerKey,
	version: StatsProxyVersion = '1.1'
): UseQueryOptions< StatsSanitizerData > {
	const statsParams = reportParamsToStatsQueryParams( params );
	const reportParams = {
		...statsParams,
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
