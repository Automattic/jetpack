/**
 * External dependencies
 */
/**
 * Internal dependencies
 */
import {
	fetchStatsProxy,
	type StatsProxyMethod,
	type StatsProxyVersion,
} from '../api/stats-proxy-fetch';
import {
	sanitizeStatsClicksResponse,
	sanitizeStatsDevicesResponse,
	sanitizeStatsFileDownloadsResponse,
	sanitizeStatsGenericListResponse,
	sanitizeStatsLocationsResponse,
	sanitizeStatsPassthroughResponse,
	sanitizeStatsReferrersResponse,
	sanitizeStatsSearchTermsResponse,
	sanitizeStatsSiteResponse,
	sanitizeStatsTopAuthorsResponse,
	sanitizeStatsTopPostsResponse,
	sanitizeStatsUtmResponse,
	sanitizeStatsVideoPlaysResponse,
	sanitizeStatsVisitsResponse,
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

export type StatsQueryConfig< TData = unknown > = {
	name: string;
	version: StatsProxyVersion;
	endpoint: string;
	params?: StatsQueryParams;
	method?: StatsProxyMethod;
	body?: unknown;
	sanitize?: ( response: unknown, params?: StatsQueryParams ) => TData;
	enabled?: boolean;
};

export function statsProxyQuery< TData = unknown >( {
	name,
	version,
	endpoint,
	params,
	method = 'GET',
	body,
	sanitize = sanitizeStatsPassthroughResponse as ( response: unknown ) => TData,
	enabled = true,
}: StatsQueryConfig< TData > ): UseQueryOptions< TData > {
	return {
		queryKey: [
			'stats',
			name,
			version,
			endpoint,
			method,
			statsQueryKeyPart( params ),
			body ?? null,
			sanitize,
		],
		queryFn: async () => {
			const response = await fetchStatsProxy( { version, endpoint, params, method, body } );
			return sanitize( response, params );
		},
		enabled,
		placeholderData: previousData => previousData,
	};
}

function statsReportQuery< TData = StatsNormalizedReport >(
	name: string,
	endpoint: string,
	params: StatsReportParams,
	sanitize: ( response: unknown, params?: StatsQueryParams ) => TData,
	version: StatsProxyVersion = '1.1'
): UseQueryOptions< TData > {
	const statsParams = reportParamsToStatsQueryParams( params );

	return statsProxyQuery( {
		name,
		version,
		endpoint,
		params: statsParams,
		sanitize,
		enabled: !! ( statsParams.date || statsParams.start_date || params.from || params.to ),
	} );
}

export const statsSiteQuery = ( params: StatsQueryParams = {} ) =>
	statsProxyQuery( {
		name: 'site',
		version: '1.1',
		endpoint: 'stats',
		params,
		sanitize: sanitizeStatsSiteResponse,
	} );

export const statsTopPostsQuery = ( params: StatsReportParams ) =>
	statsReportQuery( 'top-posts', 'stats/top-posts', params, sanitizeStatsTopPostsResponse );

export const statsReferrersQuery = ( params: StatsReportParams ) =>
	statsReportQuery( 'referrers', 'stats/referrers', params, sanitizeStatsReferrersResponse );

export const statsClicksQuery = ( params: StatsReportParams ) =>
	statsReportQuery( 'clicks', 'stats/clicks', params, sanitizeStatsClicksResponse );

export const statsSearchTermsQuery = ( params: StatsReportParams ) =>
	statsReportQuery(
		'search-terms',
		'stats/search-terms',
		params,
		sanitizeStatsSearchTermsResponse
	);

export const statsFileDownloadsQuery = ( params: StatsReportParams ) =>
	statsReportQuery(
		'file-downloads',
		'stats/file-downloads',
		params,
		sanitizeStatsFileDownloadsResponse
	);

export const statsTopAuthorsQuery = ( params: StatsReportParams ) =>
	statsReportQuery( 'top-authors', 'stats/top-authors', params, sanitizeStatsTopAuthorsResponse );

export const statsLocationsQuery = (
	params: StatsReportParams & { geoMode?: 'country' | 'region' | 'city' }
) => {
	const geoMode = params.geoMode ?? 'country';
	return statsReportQuery(
		`locations-${ geoMode }`,
		`stats/location-views/${ geoMode }`,
		params,
		sanitizeStatsLocationsResponse
	);
};

export const statsCountryViewsQuery = ( params: StatsReportParams ) =>
	statsReportQuery(
		'country-views',
		'stats/country-views',
		params,
		sanitizeStatsLocationsResponse
	);

export const statsVideoPlaysQuery = ( params: StatsReportParams ) =>
	statsReportQuery( 'video-plays', 'stats/video-plays', params, sanitizeStatsVideoPlaysResponse );

export const statsVisitsQuery = ( params: StatsReportParams ) =>
	statsReportQuery( 'visits', 'stats/visits', params, sanitizeStatsVisitsResponse );

export const statsUtmQuery = ( params: StatsReportParams & { utmParams?: string } ) =>
	statsReportQuery(
		'utm',
		`stats/utm/${ params.utmParams ?? 'utm_source,utm_medium' }`,
		params,
		sanitizeStatsUtmResponse
	);

export const statsDevicesQuery = ( params: StatsReportParams & { deviceProperty?: string } ) =>
	statsReportQuery(
		'devices',
		`stats/devices/${ params.deviceProperty ?? 'screensize' }`,
		params,
		sanitizeStatsDevicesResponse
	);

export const statsArchivesQuery = ( params: StatsReportParams ) =>
	statsReportQuery( 'archives', 'stats/archives', params, response =>
		sanitizeStatsGenericListResponse( response )
	);

export const statsPublicizeQuery = ( params: StatsReportParams ) =>
	statsReportQuery( 'publicize', 'stats/publicize', params, response =>
		sanitizeStatsGenericListResponse( response, 'followers', 'label' )
	);

export const statsFollowersQuery = ( params: StatsReportParams ) =>
	statsReportQuery( 'followers', 'stats/followers', params, response =>
		sanitizeStatsGenericListResponse( response, 'total', 'label' )
	);

export const statsTagsQuery = ( params: StatsReportParams ) =>
	statsReportQuery( 'tags', 'stats/tags', params, response =>
		sanitizeStatsGenericListResponse( response, 'views', 'name' )
	);

export const statsCommentsQuery = ( params: StatsReportParams ) =>
	statsReportQuery( 'comments', 'stats/comments', params, response =>
		sanitizeStatsGenericListResponse( response, 'comments', 'name' )
	);

export const statsCommentFollowersQuery = ( params: StatsReportParams ) =>
	statsReportQuery( 'comment-followers', 'stats/comment-followers', params, response =>
		sanitizeStatsGenericListResponse( response, 'followers', 'title' )
	);

export const statsStreakQuery = ( params: StatsQueryParams = {} ) =>
	statsProxyQuery( { name: 'streak', version: '1.1', endpoint: 'stats/streak', params } );

export const statsInsightsQuery = ( params: StatsQueryParams = {} ) =>
	statsProxyQuery( { name: 'insights', version: '1.1', endpoint: 'stats/insights', params } );

export const statsHighlightsQuery = ( params: StatsQueryParams = {} ) =>
	statsProxyQuery( { name: 'highlights', version: '1.1', endpoint: 'stats/highlights', params } );

export const statsSubscribersQuery = ( params: StatsQueryParams = {} ) =>
	statsProxyQuery( { name: 'subscribers', version: '1.1', endpoint: 'stats/subscribers', params } );

export const statsSinglePostQuery = ( postId: number, params: StatsQueryParams = {} ) =>
	statsProxyQuery( {
		name: 'single-post',
		version: '1.1',
		endpoint: `stats/post/${ postId }`,
		params,
	} );

export const statsSingleVideoQuery = ( videoId: number, params: StatsQueryParams = {} ) =>
	statsProxyQuery( {
		name: 'single-video',
		version: '1.1',
		endpoint: `stats/video/${ videoId }`,
		params,
	} );

export const statsEmailSummaryQuery = ( params: StatsQueryParams = {} ) =>
	statsProxyQuery( {
		name: 'email-summary',
		version: '1.1',
		endpoint: 'stats/emails/summary',
		params,
	} );

export const statsEmailOpensBreakdownQuery = (
	postId: number,
	breakdown: 'client' | 'device' | 'country' | 'rate',
	params: StatsQueryParams = {}
) =>
	statsProxyQuery( {
		name: `email-opens-${ breakdown }`,
		version: '1.1',
		endpoint: `stats/opens/emails/${ postId }/${ breakdown }`,
		params,
	} );

export const statsEmailClicksBreakdownQuery = (
	postId: number,
	breakdown: 'client' | 'device' | 'country' | 'rate' | 'link' | 'user-content-link',
	params: StatsQueryParams = {}
) =>
	statsProxyQuery( {
		name: `email-clicks-${ breakdown }`,
		version: '1.1',
		endpoint: `stats/clicks/emails/${ postId }/${ breakdown }`,
		params,
	} );

export const statsEmailOpensTimeSeriesQuery = ( postId: number, params: StatsQueryParams = {} ) =>
	statsProxyQuery( {
		name: 'email-opens-time-series',
		version: '1.1',
		endpoint: `stats/opens/emails/${ postId }`,
		params,
	} );

export const statsEmailClicksTimeSeriesQuery = ( postId: number, params: StatsQueryParams = {} ) =>
	statsProxyQuery( {
		name: 'email-clicks-time-series',
		version: '1.1',
		endpoint: `stats/clicks/emails/${ postId }`,
		params,
	} );

export const statsReferrersSpamQuery = () =>
	statsProxyQuery( {
		name: 'referrers-spam',
		version: '1.1',
		endpoint: 'stats/referrers/spam',
	} );

export const statsSubscribersCountsQuery = ( params: StatsQueryParams = {} ) =>
	statsProxyQuery( {
		name: 'subscribers-counts',
		version: '2',
		endpoint: 'subscribers/counts',
		params,
	} );

export const statsSiteHasNeverPublishedPostQuery = ( params: StatsQueryParams = {} ) =>
	statsProxyQuery( {
		name: 'site-has-never-published-post',
		version: '2',
		endpoint: 'site-has-never-published-post',
		params,
	} );

export const statsPlanUsageQuery = ( params: StatsQueryParams = {} ) =>
	statsProxyQuery( { name: 'plan-usage', version: '2', endpoint: 'jetpack-stats/usage', params } );

export const statsDashboardModulesQuery = ( params: StatsQueryParams = {} ) =>
	statsProxyQuery( {
		name: 'dashboard-modules',
		version: '2',
		endpoint: 'jetpack-stats-dashboard/modules',
		params,
	} );

export const statsDashboardModuleSettingsQuery = ( params: StatsQueryParams = {} ) =>
	statsProxyQuery( {
		name: 'dashboard-module-settings',
		version: '2',
		endpoint: 'jetpack-stats-dashboard/module-settings',
		params,
	} );

export const statsWordAdsEarningsQuery = ( params: StatsQueryParams = {} ) =>
	statsProxyQuery( {
		name: 'wordads-earnings',
		version: '1.1',
		endpoint: 'wordads/earnings',
		params,
	} );

export const statsWordAdsStatsQuery = ( params: StatsQueryParams = {} ) =>
	statsProxyQuery( { name: 'wordads-stats', version: '1.1', endpoint: 'wordads/stats', params } );

export const statsPurchasesQuery = ( params: StatsQueryParams = {} ) =>
	statsProxyQuery( { name: 'purchases', version: '1.2', endpoint: 'upgrades', params } );
