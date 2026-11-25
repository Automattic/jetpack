import '@testing-library/jest-dom';
import { isWpcomPlatformSite } from '@automattic/jetpack-script-data';
import { render, screen } from '@testing-library/react';
import { HelpContent } from '../content';

jest.mock( '@automattic/jetpack-script-data' );
jest.mock( '../use-help-tracking', () => ( {
	useHelpTracking: () => ( { trackHelpRequest: jest.fn() } ),
} ) );

const mockIsWpcomPlatformSite = isWpcomPlatformSite as jest.MockedFunction<
	typeof isWpcomPlatformSite
>;

const redirect = ( slug: string ) => `https://jetpack.com/redirect/?source=${ slug }`;

describe( 'HelpContent', () => {
	it.each( [
		{
			host: 'a self-hosted site',
			isWpcomPlatform: false,
			documentation: redirect( 'jetpack-support' ),
			contactSupport: redirect( 'jetpack-contact-support' ),
			developers: redirect( 'jetpack-for-developers' ),
			troubleshooting:
				'Having trouble with Jetpack? Check out recommended steps to fix common problems.',
		},
		{
			host: 'a WordPress.com site',
			isWpcomPlatform: true,
			documentation: 'https://wordpress.com/support/',
			contactSupport: 'https://wordpress.com/help/contact',
			developers: null,
			troubleshooting: "Having trouble? Check out WordPress.com's guides to fix common problems.",
		},
	] )(
		'links to the support channel of $host',
		( { isWpcomPlatform, documentation, contactSupport, developers, troubleshooting } ) => {
			mockIsWpcomPlatformSite.mockReturnValue( isWpcomPlatform );

			render( <HelpContent /> );

			expect( screen.getByRole( 'link', { name: /Explore our Help Center/ } ) ).toHaveAttribute(
				'href',
				documentation
			);
			expect( screen.getByRole( 'link', { name: /Troubleshooting/ } ) ).toHaveAttribute(
				'href',
				documentation
			);
			expect( screen.getByText( troubleshooting ) ).toBeInTheDocument();
			expect( screen.getByRole( 'link', { name: /Ask us a question/ } ) ).toHaveAttribute(
				'href',
				contactSupport
			);

			const developersLink = screen.queryByRole( 'link', { name: /Jetpack for developers/ } );
			expect( developersLink?.getAttribute( 'href' ) ?? null ).toBe( developers );
		}
	);
} );
