/**
 * Internal dependencies
 */
import * as dataPackage from '../../index';

describe( 'Stats public hook names', () => {
	it( 'exports discoverable family-prefixed Stats hooks', () => {
		expect( dataPackage ).toHaveProperty( 'useStatsEmailSummary' );
		expect( dataPackage ).toHaveProperty( 'useStatsEmailOpensBreakdown' );
		expect( dataPackage ).toHaveProperty( 'useStatsEmailClicksBreakdown' );
		expect( dataPackage ).toHaveProperty( 'useStatsWordAdsStats' );
		expect( dataPackage ).toHaveProperty( 'useStatsUtm' );
	} );

	it( 'exports Stats app/admin resource hooks separately from report hooks', () => {
		expect( dataPackage ).toHaveProperty( 'useStatsAppReferrersSpam' );
		expect( dataPackage ).toHaveProperty( 'useStatsAppReferrersMarkSpamMutation' );
		expect( dataPackage ).toHaveProperty( 'useStatsAppDashboardModules' );
		expect( dataPackage ).toHaveProperty( 'useStatsAppDashboardModulesMutation' );
		expect( dataPackage ).toHaveProperty( 'useStatsAppDashboardModuleSettings' );
		expect( dataPackage ).toHaveProperty( 'useStatsAppPlanUsage' );
		expect( dataPackage ).toHaveProperty( 'useStatsAppPurchases' );
		expect( dataPackage ).toHaveProperty( 'useStatsAppNotices' );
		expect( dataPackage ).toHaveProperty( 'useStatsAppNoticeMutation' );
		expect( dataPackage ).toHaveProperty( 'useStatsAppWordAdsEarnings' );
		expect( dataPackage ).toHaveProperty( 'useStatsAppCommercialClassificationMutation' );
	} );
} );
