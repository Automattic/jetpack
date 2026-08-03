import { getDatePart } from '@jetpack-premium-analytics/datetime';
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

// Including `StatsProxyParams` confuses TypeScript because it brings in a string index signature,
// which conflicts with `ReportParams.filters`. Endpoint-specific extras reach the proxy through
// `statsReportQuery`'s `extraParams`, not this index signature.
export type StatsReportParams = ReportParams & StatsQueryParamFields;
type StatsSanitizer< TData = unknown > = ( response: unknown, params?: StatsQueryParams ) => TData;

type StatsReportQuerySettings = {
	/** Query params derived from the shared report range that this endpoint does not accept. */
	omitParams?: readonly ( keyof StatsQueryParamFields )[];
	/**
	 * Trim `start_date`/`end_date`/`date` to a bare `yyyy-MM-dd` before sending.
	 *
	 * Most v1.1 Stats endpoints resolve an offset-bearing ISO datetime to the
	 * calendar day the caller intended. A few still resolve it in UTC instead of
	 * the site's timezone: the offset is read and then discarded, so a window
	 * ending late in the local evening lands on the following day. Opt those
	 * endpoints out — a bare day is what a correct resolver would arrive at
	 * anyway, so trimming loses nothing.
	 *
	 * A stopgap, not the fix. Remove each opt-in as its server-side ticket
	 * lands; WOOA7S-1842 is the last one outstanding.
	 */
	bareDateParams?: boolean;
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
		// List reports are day-bucketed: `days` counts calendar days and the
		// summarized window is `period` × `days`, so the dashboard's chart
		// interval must not leak in as the period (e.g. `period=week` with
		// `days=189` would cover 189 weeks). Callers can still force a period
		// explicitly via `params.period`.
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

	if ( settings?.bareDateParams ) {
		for ( const param of [ 'start_date', 'end_date', 'date' ] as const ) {
			const bare = getDatePart( queryParams[ param ] );

			if ( bare ) {
				queryParams[ param ] = bare;
			}
		}
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
