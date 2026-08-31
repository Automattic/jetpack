import {
	fetchStatsProxy,
	type StatsProxyMethod,
	type StatsProxyParams,
	type StatsProxyVersion,
} from '../api';
import {
	sanitizeStatsClicksResponse,
	sanitizeStatsDevicesResponse,
	sanitizeStatsFileDownloadsResponse,
	sanitizeStatsHighlightsResponse,
	sanitizeStatsLocationsResponse,
	sanitizeStatsArchivesResponse,
	sanitizeStatsCommentFollowersResponse,
	sanitizeStatsFollowersResponse,
	sanitizeStatsCommentsResponse,
	sanitizeStatsHourOfDayResponse,
	sanitizeStatsInsightsResponse,
	sanitizeStatsStreakResponse,
	sanitizeStatsVisitsResponse,
	sanitizeStatsTagsResponse,
	sanitizeStatsTimeSeriesResponse,
	sanitizeStatsEmailTimeSeriesResponse,
	sanitizeStatsEmailBreakdownResponse,
	sanitizeStatsEmailSummaryResponse,
	sanitizeStatsPassthroughResponse,
	sanitizeStatsPostCommentsResponse,
	sanitizeStatsPostLikesResponse,
	sanitizeStatsPostResponse,
	sanitizeStatsReferrersResponse,
	sanitizeStatsSearchTermsResponse,
	sanitizeStatsSingleVideoResponse,
	sanitizeStatsSiteResponse,
	sanitizeStatsSubscribersCountsResponse,
	sanitizeStatsSubscribersResponse,
	sanitizeStatsSummaryResponse,
	sanitizeStatsTopAuthorsResponse,
	sanitizeStatsTopPostsResponse,
	sanitizeStatsUtmResponse,
	sanitizeStatsVideoPlaysResponse,
	sanitizeStatsWordAdsEarningsResponse,
	sanitizeStatsWordAdsStatsResponse,
} from '../processing/stats';
import {
	reportParamsToStatsQueryParams,
	statsQueryParamsToApiParams,
	type StatsQueryParams,
	type StatsQueryParamFields,
} from '../utils/stats-params';
import type { ReportParams } from '../utils/search';
import type { UseQueryOptions } from '@tanstack/react-query';

// `StatsProxyParams` is deliberately left out: its string index signature conflicts
// with `ReportParams.filters`. Extras reach the proxy through `extraParams` instead.
export type StatsReportParams = ReportParams & StatsQueryParamFields;
type StatsSanitizer< TData = unknown > = ( response: unknown, params?: StatsQueryParams ) => TData;

type StatsReportQuerySettings = {
	/**
	 * Query params derived from the shared report range that this endpoint does not accept.
	 * WPCOM intersects the query string with the endpoint's declared parameters, so an
	 * undeclared one is dropped before the handler runs — omitting it here only keeps the
	 * request URL and the proxy cache key honest.
	 */
	omitParams?: readonly ( keyof StatsQueryParamFields )[];
};

const statsSanitizers = {
	passthrough: sanitizeStatsPassthroughResponse,
	post: sanitizeStatsPostResponse,
	postComments: sanitizeStatsPostCommentsResponse,
	postLikes: sanitizeStatsPostLikesResponse,
	site: sanitizeStatsSiteResponse,
	topPosts: sanitizeStatsTopPostsResponse,
	referrers: sanitizeStatsReferrersResponse,
	clicks: sanitizeStatsClicksResponse,
	searchTerms: sanitizeStatsSearchTermsResponse,
	fileDownloads: sanitizeStatsFileDownloadsResponse,
	highlights: sanitizeStatsHighlightsResponse,
	topAuthors: sanitizeStatsTopAuthorsResponse,
	locations: sanitizeStatsLocationsResponse,
	videoPlays: sanitizeStatsVideoPlaysResponse,
	archives: sanitizeStatsArchivesResponse,
	commentFollowers: sanitizeStatsCommentFollowersResponse,
	followers: sanitizeStatsFollowersResponse,
	comments: sanitizeStatsCommentsResponse,
	devices: sanitizeStatsDevicesResponse,
	insights: sanitizeStatsInsightsResponse,
	streak: sanitizeStatsStreakResponse,
	tags: sanitizeStatsTagsResponse,
	utm: sanitizeStatsUtmResponse,
	visits: sanitizeStatsVisitsResponse,
	hourOfDay: sanitizeStatsHourOfDayResponse,
	timeSeries: sanitizeStatsTimeSeriesResponse,
	emailTimeSeries: sanitizeStatsEmailTimeSeriesResponse,
	subscribers: sanitizeStatsSubscribersResponse,
	subscribersCounts: sanitizeStatsSubscribersCountsResponse,
	wordAdsStats: sanitizeStatsWordAdsStatsResponse,
	wordAdsEarnings: sanitizeStatsWordAdsEarningsResponse,
	emailBreakdown: sanitizeStatsEmailBreakdownResponse,
	emailSummary: sanitizeStatsEmailSummaryResponse,
	singleVideo: sanitizeStatsSingleVideoResponse,
	summary: sanitizeStatsSummaryResponse,
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
	sanitizerParams?: StatsQueryParams;
	enabled?: boolean;
};

export function statsProxyQuery< TSanitizer extends StatsSanitizerKey >(
	config: StatsQueryConfig< TSanitizer > & { sanitizer: TSanitizer }
): StatsReportQueryOptions< TSanitizer >;
export function statsProxyQuery(
	config: StatsQueryConfig
): StatsReportQueryOptions< 'passthrough' >;
export function statsProxyQuery( config: StatsQueryConfig ): StatsReportQueryOptions {
	const {
		name,
		version,
		endpoint,
		params,
		method = 'GET',
		body,
		sanitizerParams,
		enabled = true,
	} = config;
	const sanitizer = config.sanitizer ?? 'passthrough';
	const apiParams = statsQueryParamsToApiParams( params );

	return {
		queryKey: [
			'stats',
			name,
			version,
			endpoint,
			method,
			apiParams,
			body,
			sanitizer,
			...( sanitizerParams ? [ sanitizerParams ] : [] ),
		],
		queryFn: async () => {
			const response = await fetchStatsProxy( {
				version,
				endpoint,
				params: apiParams,
				method,
				body,
			} );
			return statsSanitizers[ sanitizer ]( response, {
				...apiParams,
				...sanitizerParams,
			} );
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
	extraParams?: StatsProxyParams,
	settings?: StatsReportQuerySettings
): StatsReportQueryOptions< TSanitizer > {
	const statsParams = reportParamsToStatsQueryParams( params );
	const reportParams = {
		...statsParams,
		// The summarized window is `period` × `days`, so the dashboard's chart
		// interval must not leak in as the period — `period=week` with `days=189`
		// would cover 189 weeks.
		...( params.period === undefined ? { period: 'day' as const } : {} ),
		...extraParams,
		...( statsParams.summarize === undefined &&
		typeof statsParams.days === 'number' &&
		statsParams.days > 1
			? { summarize: 1 }
			: {} ),
	};
	const queryParams: StatsQueryParams = { ...reportParams };

	for ( const param of settings?.omitParams ?? [] ) {
		delete queryParams[ param ];
	}

	return statsProxyQuery( {
		name,
		version,
		endpoint,
		params: queryParams,
		sanitizer,
		enabled: !! ( queryParams.end_date || queryParams.date || queryParams.start_date ),
	} );
}
