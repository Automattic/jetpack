/**
 * Internal dependencies
 */
import * as dataPackage from '../../index';

describe( 'Stats public hook names', () => {
	it( 'exports discoverable family-prefixed Stats hooks', () => {
		expect( dataPackage ).toHaveProperty( 'useStatsEmailSummary' );
		expect( dataPackage ).toHaveProperty( 'useStatsEmailOpensBreakdown' );
		expect( dataPackage ).toHaveProperty( 'useStatsEmailClicksBreakdown' );
		expect( dataPackage ).toHaveProperty( 'useStatsReferrersSpam' );
		expect( dataPackage ).toHaveProperty( 'useStatsReferrersMarkSpamMutation' );
		expect( dataPackage ).toHaveProperty( 'useStatsDashboardModules' );
		expect( dataPackage ).toHaveProperty( 'useStatsDashboardModulesMutation' );
		expect( dataPackage ).toHaveProperty( 'useStatsWordAdsEarnings' );
		expect( dataPackage ).toHaveProperty( 'useStatsWordAdsStats' );
		expect( dataPackage ).toHaveProperty( 'useStatsUtm' );
	} );
} );
