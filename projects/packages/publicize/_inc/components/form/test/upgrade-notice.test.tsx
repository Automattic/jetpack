import { render, screen } from '@testing-library/react';
import { clearMockedScriptData, mockScriptData } from '../../../utils/test-utils';
import { UpgradeNotice } from '../upgrade-notice';

/**
 * Find notice copy, ignoring the duplicate that `spokenMessage` mirrors into
 * the a11y live region.
 *
 * @param text - The exact copy to look for.
 * @return The matching element.
 */
function getNoticeText( text: string ) {
	return screen.getByText( text, { ignore: '.a11y-speak-region' } );
}

/**
 * A WordPress.com Simple site without Social's paid features. PHP hands it the
 * WordPress.com plan that unlocks them, since the standalone Jetpack Social plan
 * can't be bought there.
 *
 * @return The installed script data.
 */
const setupSimpleSite = () =>
	mockScriptData( {
		site: { host: 'wpcom', suffix: 'example.wordpress.com', plan: { features: { active: [] } } },
		social: { upgrade: { plan_slug: 'business-bundle', plan_name: 'Business' } },
	} );

/**
 * A self-hosted Jetpack site without Social's paid features.
 *
 * @return The installed script data.
 */
const setupSelfHostedSite = () =>
	mockScriptData( {
		site: { host: 'unknown', suffix: 'example.com', plan: { features: { active: [] } } },
	} );

describe( 'UpgradeNotice', () => {
	afterEach( clearMockedScriptData );

	it( 'offers a Simple site the WordPress.com plans page', () => {
		setupSimpleSite();

		render( <UpgradeNotice /> );

		const url = new URL(
			screen.getByRole( 'link', { name: 'Upgrade now' } ).getAttribute( 'href' )
		);

		expect( url.origin + url.pathname ).toBe( 'https://wordpress.com/plans/example.wordpress.com' );
		expect( url.searchParams.get( 'plan' ) ).toBe( 'business-bundle' );
	} );

	it( 'names the required plan on a Simple site', () => {
		setupSimpleSite();

		render( <UpgradeNotice /> );

		expect(
			getNoticeText(
				'Upgrade to the Business plan to choose your social media image or video to share.'
			)
		).toBeInTheDocument();
	} );

	it( 'keeps the Jetpack redirect service for self-hosted sites', () => {
		setupSelfHostedSite();

		render( <UpgradeNotice /> );

		expect( screen.getByRole( 'link', { name: 'Upgrade now' } ) ).toHaveAttribute(
			'href',
			expect.stringContaining( 'source=jetpack-social-basic-plan-block-editor' )
		);
	} );

	it( 'keeps the plan-agnostic copy on self-hosted sites', () => {
		setupSelfHostedSite();

		render( <UpgradeNotice /> );

		expect(
			getNoticeText( 'Choose your social media image or video to share.' )
		).toBeInTheDocument();
	} );
} );
