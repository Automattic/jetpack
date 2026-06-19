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
} );
