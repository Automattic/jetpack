/**
 * External dependencies
 */
import { useMutation, useQuery } from '@tanstack/react-query';
/**
 * Internal dependencies
 */
import { fetchStatsProxy } from '../api/stats-proxy-fetch';
import { queryClient } from '../providers';
import {
	statsArchivesQuery,
	statsClicksQuery,
	statsCommentFollowersQuery,
	statsCommentsQuery,
	statsCountryViewsQuery,
	statsDashboardModulesQuery,
	statsDashboardModuleSettingsQuery,
	statsDevicesQuery,
	statsEmailClicksBreakdownQuery,
	statsEmailClicksTimeSeriesQuery,
	statsEmailOpensBreakdownQuery,
	statsEmailOpensTimeSeriesQuery,
	statsEmailSummaryQuery,
	statsFileDownloadsQuery,
	statsFollowersQuery,
	statsHighlightsQuery,
	statsInsightsQuery,
	statsLocationsQuery,
	statsPlanUsageQuery,
	statsPublicizeQuery,
	statsPurchasesQuery,
	statsReferrersQuery,
	statsReferrersSpamQuery,
	statsSearchTermsQuery,
	statsSinglePostQuery,
	statsSingleVideoQuery,
	statsSiteHasNeverPublishedPostQuery,
	statsSiteQuery,
	statsStreakQuery,
	statsSubscribersCountsQuery,
	statsSubscribersQuery,
	statsTagsQuery,
	statsTopAuthorsQuery,
	statsTopPostsQuery,
	statsUtmQuery,
	statsVideoPlaysQuery,
	statsVisitsQuery,
	statsWordAdsEarningsQuery,
	statsWordAdsStatsQuery,
	type StatsReportParams,
} from '../queries/stats-queries';
import { useReport } from './use-report';
import type { StatsQueryParams } from '../utils/stats-params';

type UseStatsOptions = {
	enabled?: boolean;
};

type StatsReportQueryFactory< TParams extends StatsReportParams = StatsReportParams > = (
	params: TParams
) => ReturnType< typeof statsTopPostsQuery >;

function useStatsReport(
	queryFactory: StatsReportQueryFactory,
	params: StatsReportParams,
	disabledComparisonKey: string[],
	options?: UseStatsOptions
) {
	return useReport( p => queryFactory( p as StatsReportParams ), params, {
		enabled: options?.enabled,
		disabledComparisonKey,
	} );
}

export function useStatsSite( params?: StatsQueryParams, options?: UseStatsOptions ) {
	return useQuery( { ...statsSiteQuery( params ), enabled: options?.enabled ?? true } );
}

export function useStatsTopPosts( params: StatsReportParams, options?: UseStatsOptions ) {
	return useStatsReport(
		statsTopPostsQuery,
		params,
		[ 'stats', 'top-posts', '__comparison__', 'disabled' ],
		options
	);
}

export function useStatsReferrers( params: StatsReportParams, options?: UseStatsOptions ) {
	return useStatsReport(
		statsReferrersQuery,
		params,
		[ 'stats', 'referrers', '__comparison__', 'disabled' ],
		options
	);
}

export function useStatsClicks( params: StatsReportParams, options?: UseStatsOptions ) {
	return useStatsReport(
		statsClicksQuery,
		params,
		[ 'stats', 'clicks', '__comparison__', 'disabled' ],
		options
	);
}

export function useStatsSearchTerms( params: StatsReportParams, options?: UseStatsOptions ) {
	return useStatsReport(
		statsSearchTermsQuery,
		params,
		[ 'stats', 'search-terms', '__comparison__', 'disabled' ],
		options
	);
}

export function useStatsFileDownloads( params: StatsReportParams, options?: UseStatsOptions ) {
	return useStatsReport(
		statsFileDownloadsQuery,
		params,
		[ 'stats', 'file-downloads', '__comparison__', 'disabled' ],
		options
	);
}

export function useStatsTopAuthors( params: StatsReportParams, options?: UseStatsOptions ) {
	return useStatsReport(
		statsTopAuthorsQuery,
		params,
		[ 'stats', 'top-authors', '__comparison__', 'disabled' ],
		options
	);
}

export function useStatsLocations(
	params: StatsReportParams & { geoMode?: 'country' | 'region' | 'city' },
	options?: UseStatsOptions
) {
	return useStatsReport(
		statsLocationsQuery,
		params,
		[ 'stats', 'locations', '__comparison__', 'disabled' ],
		options
	);
}

export function useStatsCountryViews( params: StatsReportParams, options?: UseStatsOptions ) {
	return useStatsReport(
		statsCountryViewsQuery,
		params,
		[ 'stats', 'country-views', '__comparison__', 'disabled' ],
		options
	);
}

export function useStatsVideoPlays( params: StatsReportParams, options?: UseStatsOptions ) {
	return useStatsReport(
		statsVideoPlaysQuery,
		params,
		[ 'stats', 'video-plays', '__comparison__', 'disabled' ],
		options
	);
}

export function useStatsVisits( params: StatsReportParams, options?: UseStatsOptions ) {
	return useStatsReport(
		statsVisitsQuery,
		params,
		[ 'stats', 'visits', '__comparison__', 'disabled' ],
		options
	);
}

export function useStatsUtm(
	params: StatsReportParams & { utmParams?: string },
	options?: UseStatsOptions
) {
	return useStatsReport(
		statsUtmQuery,
		params,
		[ 'stats', 'utm', '__comparison__', 'disabled' ],
		options
	);
}

export function useStatsDevices(
	params: StatsReportParams & { deviceProperty?: string },
	options?: UseStatsOptions
) {
	return useStatsReport(
		statsDevicesQuery,
		params,
		[ 'stats', 'devices', '__comparison__', 'disabled' ],
		options
	);
}

export function useStatsArchives( params: StatsReportParams, options?: UseStatsOptions ) {
	return useStatsReport(
		statsArchivesQuery,
		params,
		[ 'stats', 'archives', '__comparison__', 'disabled' ],
		options
	);
}

export function useStatsPublicize( params: StatsReportParams, options?: UseStatsOptions ) {
	return useStatsReport(
		statsPublicizeQuery,
		params,
		[ 'stats', 'publicize', '__comparison__', 'disabled' ],
		options
	);
}

export function useStatsFollowers( params: StatsReportParams, options?: UseStatsOptions ) {
	return useStatsReport(
		statsFollowersQuery,
		params,
		[ 'stats', 'followers', '__comparison__', 'disabled' ],
		options
	);
}

export function useStatsTags( params: StatsReportParams, options?: UseStatsOptions ) {
	return useStatsReport(
		statsTagsQuery,
		params,
		[ 'stats', 'tags', '__comparison__', 'disabled' ],
		options
	);
}

export function useStatsComments( params: StatsReportParams, options?: UseStatsOptions ) {
	return useStatsReport(
		statsCommentsQuery,
		params,
		[ 'stats', 'comments', '__comparison__', 'disabled' ],
		options
	);
}

export function useStatsCommentFollowers( params: StatsReportParams, options?: UseStatsOptions ) {
	return useStatsReport(
		statsCommentFollowersQuery,
		params,
		[ 'stats', 'comment-followers', '__comparison__', 'disabled' ],
		options
	);
}

export function useStatsStreak( params?: StatsQueryParams, options?: UseStatsOptions ) {
	return useQuery( { ...statsStreakQuery( params ), enabled: options?.enabled ?? true } );
}

export function useStatsInsights( params?: StatsQueryParams, options?: UseStatsOptions ) {
	return useQuery( { ...statsInsightsQuery( params ), enabled: options?.enabled ?? true } );
}

export function useStatsHighlights( params?: StatsQueryParams, options?: UseStatsOptions ) {
	return useQuery( { ...statsHighlightsQuery( params ), enabled: options?.enabled ?? true } );
}

export function useStatsSubscribers( params?: StatsQueryParams, options?: UseStatsOptions ) {
	return useQuery( { ...statsSubscribersQuery( params ), enabled: options?.enabled ?? true } );
}

export function useStatsSinglePost(
	postId: number,
	params?: StatsQueryParams,
	options?: UseStatsOptions
) {
	return useQuery( {
		...statsSinglePostQuery( postId, params ),
		enabled: ( options?.enabled ?? true ) && !! postId,
	} );
}

export function useStatsSingleVideo(
	videoId: number,
	params?: StatsQueryParams,
	options?: UseStatsOptions
) {
	return useQuery( {
		...statsSingleVideoQuery( videoId, params ),
		enabled: ( options?.enabled ?? true ) && !! videoId,
	} );
}

export function useStatsEmailSummary( params?: StatsQueryParams, options?: UseStatsOptions ) {
	return useQuery( { ...statsEmailSummaryQuery( params ), enabled: options?.enabled ?? true } );
}

export function useStatsEmailOpensBreakdown(
	postId: number,
	breakdown: 'client' | 'device' | 'country' | 'rate',
	params?: StatsQueryParams,
	options?: UseStatsOptions
) {
	return useQuery( {
		...statsEmailOpensBreakdownQuery( postId, breakdown, params ),
		enabled: ( options?.enabled ?? true ) && !! postId,
	} );
}

export function useStatsEmailClicksBreakdown(
	postId: number,
	breakdown: 'client' | 'device' | 'country' | 'rate' | 'link' | 'user-content-link',
	params?: StatsQueryParams,
	options?: UseStatsOptions
) {
	return useQuery( {
		...statsEmailClicksBreakdownQuery( postId, breakdown, params ),
		enabled: ( options?.enabled ?? true ) && !! postId,
	} );
}

export function useStatsEmailOpensTimeSeries(
	postId: number,
	params?: StatsQueryParams,
	options?: UseStatsOptions
) {
	return useQuery( {
		...statsEmailOpensTimeSeriesQuery( postId, params ),
		enabled: ( options?.enabled ?? true ) && !! postId,
	} );
}

export function useStatsEmailClicksTimeSeries(
	postId: number,
	params?: StatsQueryParams,
	options?: UseStatsOptions
) {
	return useQuery( {
		...statsEmailClicksTimeSeriesQuery( postId, params ),
		enabled: ( options?.enabled ?? true ) && !! postId,
	} );
}

export function useStatsReferrersSpam( options?: UseStatsOptions ) {
	return useQuery( { ...statsReferrersSpamQuery(), enabled: options?.enabled ?? true } );
}

export function useStatsSubscribersCounts( params?: StatsQueryParams, options?: UseStatsOptions ) {
	return useQuery( {
		...statsSubscribersCountsQuery( params ),
		enabled: options?.enabled ?? true,
	} );
}

export function useStatsSiteHasNeverPublishedPost(
	params?: StatsQueryParams,
	options?: UseStatsOptions
) {
	return useQuery( {
		...statsSiteHasNeverPublishedPostQuery( params ),
		enabled: options?.enabled ?? true,
	} );
}

export function useStatsPlanUsage( params?: StatsQueryParams, options?: UseStatsOptions ) {
	return useQuery( { ...statsPlanUsageQuery( params ), enabled: options?.enabled ?? true } );
}

export function useStatsDashboardModules( params?: StatsQueryParams, options?: UseStatsOptions ) {
	return useQuery( { ...statsDashboardModulesQuery( params ), enabled: options?.enabled ?? true } );
}

export function useStatsDashboardModuleSettings(
	params?: StatsQueryParams,
	options?: UseStatsOptions
) {
	return useQuery( {
		...statsDashboardModuleSettingsQuery( params ),
		enabled: options?.enabled ?? true,
	} );
}

export function useStatsWordAdsEarnings( params?: StatsQueryParams, options?: UseStatsOptions ) {
	return useQuery( { ...statsWordAdsEarningsQuery( params ), enabled: options?.enabled ?? true } );
}

export function useStatsWordAdsStats( params?: StatsQueryParams, options?: UseStatsOptions ) {
	return useQuery( { ...statsWordAdsStatsQuery( params ), enabled: options?.enabled ?? true } );
}

export function useStatsPurchases( params?: StatsQueryParams, options?: UseStatsOptions ) {
	return useQuery( { ...statsPurchasesQuery( params ), enabled: options?.enabled ?? true } );
}

export function useStatsReferrersMarkSpamMutation() {
	return useMutation( {
		mutationFn: ( domain: string ) =>
			fetchStatsProxy( {
				version: '1.1',
				endpoint: 'stats/referrers/spam/new',
				method: 'POST',
				params: { domain },
			} ),
		onSuccess: () => {
			queryClient.invalidateQueries( { queryKey: [ 'stats', 'referrers' ] } );
			queryClient.invalidateQueries( { queryKey: [ 'stats', 'referrers-spam' ] } );
		},
	} );
}

export function useStatsReferrersUnmarkSpamMutation() {
	return useMutation( {
		mutationFn: ( domain: string ) =>
			fetchStatsProxy( {
				version: '1.1',
				endpoint: 'stats/referrers/spam/delete',
				method: 'POST',
				params: { domain },
			} ),
		onSuccess: () => {
			queryClient.invalidateQueries( { queryKey: [ 'stats', 'referrers' ] } );
			queryClient.invalidateQueries( { queryKey: [ 'stats', 'referrers-spam' ] } );
		},
	} );
}

export function useStatsDashboardModulesMutation() {
	return useMutation( {
		mutationFn: ( body: unknown ) =>
			fetchStatsProxy( {
				version: '2',
				endpoint: 'jetpack-stats-dashboard/modules',
				method: 'POST',
				body,
			} ),
		onSuccess: () => {
			queryClient.invalidateQueries( { queryKey: [ 'stats', 'dashboard-modules' ] } );
		},
	} );
}

export function useStatsDashboardModuleSettingsMutation() {
	return useMutation( {
		mutationFn: ( body: unknown ) =>
			fetchStatsProxy( {
				version: '2',
				endpoint: 'jetpack-stats-dashboard/module-settings',
				method: 'POST',
				body,
			} ),
		onSuccess: () => {
			queryClient.invalidateQueries( { queryKey: [ 'stats', 'dashboard-module-settings' ] } );
		},
	} );
}

export function useStatsCommercialClassificationMutation() {
	return useMutation( {
		mutationFn: ( params?: StatsQueryParams ) =>
			fetchStatsProxy( {
				version: '2',
				endpoint: 'commercial-classification',
				method: 'POST',
				params,
			} ),
	} );
}
