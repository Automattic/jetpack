import { isWpcomPlatformSite } from '@automattic/jetpack-script-data';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useDispatch } from '@wordpress/data';
import SupportLink from '..';

jest.mock( '@automattic/jetpack-components', () => ( {
	getRedirectUrl: jest.requireActual( '@automattic/jetpack-components/tools/jp-redirect' ).default,
} ) );

jest.mock( '@automattic/jetpack-script-data', () => ( {
	isWpcomPlatformSite: jest.fn(),
} ) );

jest.mock( '@wordpress/data', () => ( {
	useDispatch: jest.fn(),
} ) );

describe( 'SupportLink', () => {
	beforeEach( () => {
		jest.mocked( useDispatch ).mockReturnValue( undefined );
	} );

	it.each( [
		[ false, 'jetpack-videopress-admin-learn-more' ],
		[ true, 'wpcom-videopress-admin-learn-more' ],
	] )(
		'uses a platform-specific redirect without the Help Center (wpcom: %s)',
		( wpcom, source ) => {
			jest.mocked( isWpcomPlatformSite ).mockReturnValue( wpcom );

			render( <SupportLink>Learn more</SupportLink> );

			const link = screen.getByRole< HTMLAnchorElement >( 'link', { name: /Learn more/ } );
			const url = new URL( link.href );
			expect( url.origin + url.pathname ).toBe( 'https://jetpack.com/redirect/' );
			expect( url.searchParams.get( 'source' ) ).toBe( source );
			expect( link ).toHaveAttribute( 'target', '_blank' );
		}
	);

	it( 'keeps the redirect href but loads the canonical article URL in the Help Center', async () => {
		const user = userEvent.setup();
		const setShowSupportDoc = jest.fn();
		const onClick = jest.fn();
		jest.mocked( isWpcomPlatformSite ).mockReturnValue( true );
		jest.mocked( useDispatch ).mockReturnValue( { setShowSupportDoc } );

		render( <SupportLink>Learn more</SupportLink> );

		const link = screen.getByRole< HTMLAnchorElement >( 'link', { name: /Learn more/ } );
		const url = new URL( link.href );
		expect( url.searchParams.get( 'source' ) ).toBe( 'wpcom-videopress-admin-learn-more' );
		link.addEventListener( 'click', onClick, { once: true } );
		await user.click( link );

		expect( onClick.mock.calls[ 0 ][ 0 ].defaultPrevented ).toBe( true );
		expect( setShowSupportDoc ).toHaveBeenCalledWith(
			'https://wordpress.com/support/videopress/',
			4458
		);
	} );
} );
