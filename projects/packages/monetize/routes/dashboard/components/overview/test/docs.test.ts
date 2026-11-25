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
			'premiumContent',
			'source=jetpack-support-jetpack-blocks-paid-content-block',
		],
		[
			'WordPress.com',
			true,
			'premiumContent',
			'source=wpcom-support-wordpress-editor-blocks-premium-content-block',
		],
		[
			'WordPress.com',
			true,
			'adsGdpr',
			'https://wordpress.com/support/wordads-and-earn/configure-ad-settings/#consent-management',
		],
	] as const )( "links %s's %s doc on its own hosts", ( _host, isWpcom, key, expected ) => {
		mockIsWpcomPlatformSite.mockReturnValue( isWpcom );

		expect( getDocUrl( key ) ).toContain( expected );
	} );
} );
