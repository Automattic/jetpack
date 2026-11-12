import { getDocUrl } from '../docs';

const mockIsWpcomPlatformSite = jest.fn();

jest.mock( '@automattic/jetpack-script-data', () => ( {
	isWpcomPlatformSite: () => mockIsWpcomPlatformSite(),
} ) );

describe( 'getDocUrl', () => {
	it.each( [
		[
			'Jetpack',
			false,
			'url=https%3A%2F%2Fjetpack.com%2Fsupport%2Fjetpack-blocks%2Fpaid-content-block%2F',
		],
		[ 'WordPress.com', true, 'source=wpcom-support-wordpress-editor-blocks-premium-content-block' ],
	] )( "links %s's doc on its own hosts", ( _host, isWpcom, expected ) => {
		mockIsWpcomPlatformSite.mockReturnValue( isWpcom );

		expect( getDocUrl( 'premiumContent' ) ).toContain( expected );
	} );
} );
