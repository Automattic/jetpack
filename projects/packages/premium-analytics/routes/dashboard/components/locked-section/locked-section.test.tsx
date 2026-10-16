/**
 * External dependencies
 */
import jetpackAnalytics from '@automattic/jetpack-analytics';
import { getScriptData } from '@automattic/jetpack-script-data';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import { LockedSection } from './locked-section';

jest.mock(
	'@automattic/jetpack-script-data',
	() => jest.requireActual( '../../../../tests/js/script-data-test-utils' ).mockJetpackScriptData
);
jest.mock(
	'@automattic/jetpack-analytics',
	() => jest.requireActual( '../../../../tests/js/analytics-test-utils' ).mockJetpackAnalytics
);

const recordEvent = jest.mocked( jetpackAnalytics.tracks.recordEvent );

const UPGRADE_URL = 'https://wordpress.com/checkout/example.com/personal?redirect_to=x';
const SUPPORT_URL = 'https://wordpress.com/support/stats/';
const FEATURES = Array.from( { length: 11 }, ( _, index ) => `Feature ${ index + 1 }` );

/**
 * Publishes the Insights section as locked.
 *
 * @param upgradeUrl - Where the Upgrade button leads, or empty.
 */
function lockInsights( upgradeUrl = UPGRADE_URL ) {
	( getScriptData as jest.Mock ).mockReturnValue( {
		premium_analytics: {
			plan_gates: {
				tier: 'free',
				locked_features: {},
				locked_widget_types: {},
				locked_sections: {
					insights: {
						title: 'Unlock site insights',
						description: 'Get detailed insights into your site’s performance with a Personal plan.',
						features: FEATURES,
						upgrade_label: 'Upgrade to Personal',
						expand_label: 'Show all Personal features',
						support_url: SUPPORT_URL,
						upgrade_url: upgradeUrl,
					},
				},
			},
		},
	} );
}

describe( 'LockedSection', () => {
	beforeEach( () => {
		recordEvent.mockClear();
		lockInsights();
	} );

	it( 'shows the plan pitch with its first four features, the upgrade and the support link', () => {
		render( <LockedSection section="insights" /> );

		expect( screen.getByRole( 'heading', { name: 'Unlock site insights' } ) ).toBeVisible();
		expect(
			screen.getByText( 'Get detailed insights into your site’s performance with a Personal plan.' )
		).toBeVisible();
		expect( screen.getAllByRole( 'listitem' ).map( item => item.textContent ) ).toEqual(
			FEATURES.slice( 0, 4 )
		);
		expect( screen.getByRole( 'link', { name: 'Upgrade to Personal' } ) ).toHaveAttribute(
			'href',
			UPGRADE_URL
		);
		expect( screen.getByRole( 'link', { name: /Learn more/ } ) ).toHaveAttribute(
			'href',
			SUPPORT_URL
		);
	} );

	it( 'expands to every feature and collapses back', async () => {
		render( <LockedSection section="insights" /> );

		await userEvent.click( screen.getByRole( 'button', { name: 'Show all Personal features' } ) );
		expect( screen.getAllByRole( 'listitem' ) ).toHaveLength( 11 );

		await userEvent.click( screen.getByRole( 'button', { name: 'Show less' } ) );
		expect( screen.getAllByRole( 'listitem' ) ).toHaveLength( 4 );
	} );

	it( 'records the view once and the upgrade click, naming the section', async () => {
		render( <LockedSection section="insights" /> );
		// jsdom cannot follow the link.
		document.addEventListener( 'click', event => event.preventDefault(), { once: true } );

		await userEvent.click( screen.getByRole( 'link', { name: 'Upgrade to Personal' } ) );

		const props = { section: 'insights', source: 'locked_section' };
		expect( recordEvent.mock.calls ).toEqual( [
			[ 'jetpack_premium_analytics_plan_upgrade_view', props ],
			[ 'jetpack_premium_analytics_plan_upgrade_click', props ],
		] );
	} );

	it( 'drops the upgrade button when there is nowhere to buy', () => {
		lockInsights( '' );
		render( <LockedSection section="insights" /> );

		expect( screen.queryByRole( 'link', { name: 'Upgrade to Personal' } ) ).not.toBeInTheDocument();
	} );

	it( 'renders nothing for an open section', () => {
		const { container } = render( <LockedSection section="traffic" /> );

		expect( container ).toBeEmptyDOMElement();
		expect( recordEvent ).not.toHaveBeenCalled();
	} );
} );
