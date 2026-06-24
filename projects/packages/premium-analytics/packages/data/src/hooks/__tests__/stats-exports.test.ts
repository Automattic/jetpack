/**
 * Internal dependencies
 */
import * as dataPackage from '../../index';

const statsHookNames = [
	'useStatsSite',
	'useStatsTopPosts',
	'useStatsReferrers',
	'useStatsClicks',
	'useStatsSearchTerms',
	'useStatsFileDownloads',
	'useStatsTopAuthors',
	'useStatsLocations',
	'useStatsCountryViews',
	'useStatsVideoPlays',
	'useStatsVisits',
	'useStatsDevices',
	'useStatsArchives',
	'useStatsPublicize',
	'useStatsFollowers',
	'useStatsTags',
	'useStatsComments',
	'useStatsCommentFollowers',
	'useStatsStreak',
	'useStatsInsights',
	'useStatsHighlights',
	'useStatsSubscribers',
	'useStatsSubscribersCounts',
	'useStatsSinglePost',
	'useStatsSingleVideo',
	'useStatsEmailSummary',
	'useStatsEmailOpensBreakdown',
	'useStatsEmailClicksBreakdown',
	'useStatsEmailOpensTimeSeries',
	'useStatsEmailClicksTimeSeries',
	'useStatsWordAdsStats',
	'useStatsWordAdsEarnings',
	'useStatsAppReferrersSpam',
	'useStatsAppSiteHasNeverPublishedPost',
	'useStatsAppPlanUsage',
	'useStatsAppDashboardModules',
	'useStatsAppDashboardModuleSettings',
	'useStatsAppPurchases',
	'useStatsAppNotices',
	'useStatsAppReferrersMarkSpamMutation',
	'useStatsAppReferrersUnmarkSpamMutation',
	'useStatsAppDashboardModulesMutation',
	'useStatsAppDashboardModuleSettingsMutation',
	'useStatsAppNoticeMutation',
	'useStatsAppCommercialClassificationMutation',
] as const satisfies ReadonlyArray< keyof typeof dataPackage >;

describe( 'Stats public hook names', () => {
	it.each( statsHookNames )(
		'exports %s as a discoverable family-prefixed Stats hook',
		hookName => {
			expect( dataPackage[ hookName ] ).toEqual( expect.any( Function ) );
		}
	);
} );
