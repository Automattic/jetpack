/**
 * Internal dependencies
 */
import * as dataPackage from '../../index';

describe( 'Stats public hook names', () => {
	it( 'exports discoverable family-prefixed traffic hooks', () => {
		expect( dataPackage ).toHaveProperty( 'useStatsSite' );
		expect( dataPackage ).toHaveProperty( 'useStatsTopPosts' );
		expect( dataPackage ).toHaveProperty( 'useStatsReferrers' );
		expect( dataPackage ).toHaveProperty( 'useStatsClicks' );
		expect( dataPackage ).toHaveProperty( 'useStatsSearchTerms' );
		expect( dataPackage ).toHaveProperty( 'useStatsFileDownloads' );
		expect( dataPackage ).toHaveProperty( 'useStatsTopAuthors' );
		expect( dataPackage ).toHaveProperty( 'useStatsLocations' );
		expect( dataPackage ).toHaveProperty( 'useStatsCountryViews' );
		expect( dataPackage ).toHaveProperty( 'useStatsVideoPlays' );
	} );

	it( 'exports discoverable family-prefixed remaining Stats hooks', () => {
		expect( dataPackage ).toHaveProperty( 'useStatsVisits' );
		expect( dataPackage ).toHaveProperty( 'useStatsDevices' );
		expect( dataPackage ).toHaveProperty( 'useStatsArchives' );
		expect( dataPackage ).toHaveProperty( 'useStatsPublicize' );
		expect( dataPackage ).toHaveProperty( 'useStatsFollowers' );
		expect( dataPackage ).toHaveProperty( 'useStatsTags' );
		expect( dataPackage ).toHaveProperty( 'useStatsComments' );
		expect( dataPackage ).toHaveProperty( 'useStatsCommentFollowers' );
		expect( dataPackage ).toHaveProperty( 'useStatsStreak' );
		expect( dataPackage ).toHaveProperty( 'useStatsInsights' );
		expect( dataPackage ).toHaveProperty( 'useStatsHighlights' );
		expect( dataPackage ).toHaveProperty( 'useStatsSubscribers' );
		expect( dataPackage ).toHaveProperty( 'useStatsSubscribersCounts' );
		expect( dataPackage ).toHaveProperty( 'useStatsSinglePost' );
		expect( dataPackage ).toHaveProperty( 'useStatsSingleVideo' );
		expect( dataPackage ).toHaveProperty( 'useStatsEmailSummary' );
		expect( dataPackage ).toHaveProperty( 'useStatsEmailOpensBreakdown' );
		expect( dataPackage ).toHaveProperty( 'useStatsEmailClicksBreakdown' );
		expect( dataPackage ).toHaveProperty( 'useStatsEmailOpensTimeSeries' );
		expect( dataPackage ).toHaveProperty( 'useStatsEmailClicksTimeSeries' );
		expect( dataPackage ).toHaveProperty( 'useStatsWordAdsStats' );
		expect( dataPackage ).toHaveProperty( 'useStatsWordAdsEarnings' );
	} );

	it( 'exports discoverable family-prefixed Stats app hooks', () => {
		expect( dataPackage ).toHaveProperty( 'useStatsAppReferrersSpam' );
		expect( dataPackage ).toHaveProperty( 'useStatsAppSiteHasNeverPublishedPost' );
		expect( dataPackage ).toHaveProperty( 'useStatsAppPlanUsage' );
		expect( dataPackage ).toHaveProperty( 'useStatsAppDashboardModules' );
		expect( dataPackage ).toHaveProperty( 'useStatsAppDashboardModuleSettings' );
		expect( dataPackage ).toHaveProperty( 'useStatsAppPurchases' );
		expect( dataPackage ).toHaveProperty( 'useStatsAppNotices' );
		expect( dataPackage ).toHaveProperty( 'useStatsAppReferrersMarkSpamMutation' );
		expect( dataPackage ).toHaveProperty( 'useStatsAppReferrersUnmarkSpamMutation' );
		expect( dataPackage ).toHaveProperty( 'useStatsAppDashboardModulesMutation' );
		expect( dataPackage ).toHaveProperty( 'useStatsAppDashboardModuleSettingsMutation' );
		expect( dataPackage ).toHaveProperty( 'useStatsAppNoticeMutation' );
		expect( dataPackage ).toHaveProperty( 'useStatsAppCommercialClassificationMutation' );
	} );
} );
