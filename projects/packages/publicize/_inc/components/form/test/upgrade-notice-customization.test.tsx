import { render, screen } from '@testing-library/react';
import { clearMockedScriptData, mockScriptData } from '../../../utils/test-utils';
import { UpgradeNoticeCustomization } from '../upgrade-notice-customization';

jest.mock( '@automattic/jetpack-shared-extension-utils', () => ( {
	...jest.requireActual( '@automattic/jetpack-shared-extension-utils' ),
	useAnalytics: () => ( { recordEvent: jest.fn() } ),
} ) );

/**
 * Find notice copy, ignoring the duplicate `spokenMessage` mirrors into the live region.
 *
 * @param text - The exact copy to look for.
 * @return The matching element.
 */
function getNoticeText( text: string ) {
	return screen.getByText( text, { ignore: '.a11y-speak-region' } );
}

const setupSimpleSite = () =>
	mockScriptData( {
		site: { host: 'wpcom', suffix: 'example.wordpress.com', plan: { features: { active: [] } } },
		social: { upgrade: { plan_slug: 'business-bundle', plan_name: 'Business' } },
	} );

const setupSelfHostedSite = () =>
	mockScriptData( {
		site: { host: 'unknown', suffix: 'example.com', plan: { features: { active: [] } } },
	} );

describe( 'UpgradeNoticeCustomization', () => {
	afterEach( clearMockedScriptData );

	it( 'offers a Simple site the WordPress.com plans page', () => {
		setupSimpleSite();

		render( <UpgradeNoticeCustomization /> );

		const url = new URL(
			screen.getByRole( 'link', { name: 'Upgrade now' } ).getAttribute( 'href' )
		);

		expect( url.origin + url.pathname ).toBe( 'https://wordpress.com/plans/example.wordpress.com' );
		expect( url.searchParams.get( 'plan' ) ).toBe( 'business-bundle' );
	} );

	it( 'names the required plan on a Simple site', () => {
		setupSimpleSite();

		render( <UpgradeNoticeCustomization /> );

		expect(
			getNoticeText(
				'Upgrade to the Business plan to customize images and messages for each account.'
			)
		).toBeInTheDocument();
	} );

	it( 'keeps the Jetpack redirect service for self-hosted sites', () => {
		setupSelfHostedSite();

		render( <UpgradeNoticeCustomization /> );

		expect( screen.getByRole( 'link', { name: 'Upgrade now' } ) ).toHaveAttribute(
			'href',
			expect.stringContaining( 'source=jetpack-social-basic-plan-block-editor' )
		);
	} );

	it( 'keeps the plan-agnostic copy on self-hosted sites', () => {
		setupSelfHostedSite();

		render( <UpgradeNoticeCustomization /> );

		expect(
			getNoticeText( 'Customize images and messages for each account for better engagement.' )
		).toBeInTheDocument();
	} );
} );
