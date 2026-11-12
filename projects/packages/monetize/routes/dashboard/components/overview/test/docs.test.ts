import { getDocUrl } from '../docs';

const mockIsWpcomPlatformSite = jest.fn();

jest.mock( '@automattic/jetpack-script-data', () => ( {
	isWpcomPlatformSite: () => mockIsWpcomPlatformSite(),
} ) );

describe( 'getDocUrl', () => {
	it.each( [
		[ 'Jetpack', false, 'source=jetpack-support-jetpack-blocks-paid-content-block' ],
		[ 'WordPress.com', true, 'source=wpcom-support-wordpress-editor-blocks-premium-content-block' ],
	] )( "links %s's doc on its own hosts", ( _host, isWpcom, expected ) => {
		mockIsWpcomPlatformSite.mockReturnValue( isWpcom );

		expect( getDocUrl( 'premiumContent' ) ).toContain( expected );
	} );
} );
