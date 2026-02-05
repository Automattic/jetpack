import { siteHasFeature, isWpcomPlatformSite } from '@automattic/jetpack-script-data';
import { hasVideoPressPurchase } from '..';

jest.mock( '@automattic/jetpack-script-data', () => ( {
	siteHasFeature: jest.fn(),
	isWpcomPlatformSite: jest.fn(),
} ) );

describe( 'hasVideoPressPurchase', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'should return true when site has videopress-1tb-storage feature', () => {
		( siteHasFeature as jest.Mock ).mockImplementation(
			feature => feature === 'videopress-1tb-storage'
		);
		( isWpcomPlatformSite as jest.Mock ).mockReturnValue( false );

		expect( hasVideoPressPurchase() ).toBe( true );
	} );

	it( 'should return true when site has videopress-unlimited-storage feature', () => {
		( siteHasFeature as jest.Mock ).mockImplementation(
			feature => feature === 'videopress-unlimited-storage'
		);
		( isWpcomPlatformSite as jest.Mock ).mockReturnValue( false );

		expect( hasVideoPressPurchase() ).toBe( true );
	} );

	it( 'should return true on WPCOM when site has videopress feature', () => {
		( siteHasFeature as jest.Mock ).mockImplementation( feature => feature === 'videopress' );
		( isWpcomPlatformSite as jest.Mock ).mockReturnValue( true );

		expect( hasVideoPressPurchase() ).toBe( true );
	} );

	it( 'should return false on WPCOM when site only has videopress feature but is not WPCOM platform', () => {
		( siteHasFeature as jest.Mock ).mockImplementation( feature => feature === 'videopress' );
		( isWpcomPlatformSite as jest.Mock ).mockReturnValue( false );

		expect( hasVideoPressPurchase() ).toBe( false );
	} );

	it( 'should return false when site has no videopress features', () => {
		( siteHasFeature as jest.Mock ).mockReturnValue( false );
		( isWpcomPlatformSite as jest.Mock ).mockReturnValue( false );

		expect( hasVideoPressPurchase() ).toBe( false );
	} );

	it( 'should return false on WPCOM when site has no videopress features', () => {
		( siteHasFeature as jest.Mock ).mockReturnValue( false );
		( isWpcomPlatformSite as jest.Mock ).mockReturnValue( true );

		expect( hasVideoPressPurchase() ).toBe( false );
	} );
} );
