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
 * @param planPrice - The Personal plan's yearly price, or null when WordPress.com gave none.
 */
function lockInsights( planPrice: { yearly: number; currency: string } | null = null ) {
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
						description_with_price:
							'Get detailed insights into your site’s performance for <strong>%s/month</strong> with a Personal plan.',
						plan_price: planPrice,
						features: FEATURES,
						upgrade_label: 'Upgrade to Personal',
						expand_label: 'Show all Personal features',
						support_url: SUPPORT_URL,
						upgrade_url: UPGRADE_URL,
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

		expect(
			screen.getByRole( 'heading', { level: 3, name: 'Unlock site insights' } )
		).toBeVisible();
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

	it.each( [
		[ { yearly: 4800, currency: 'USD' }, '$4' ],
		[ { yearly: 5400, currency: 'USD' }, '$4.50' ],
		[ { yearly: 156000, currency: 'TWD' }, 'NT$130' ],
	] )( 'quotes the monthly price of a %o yearly plan as %s', ( planPrice, monthly ) => {
		lockInsights( planPrice );
		render( <LockedSection section="insights" /> );

		const sentence = `Get detailed insights into your site’s performance for ${ monthly }/month with a Personal plan.`;
		expect( screen.getByText( `${ monthly }/month` ).tagName ).toBe( 'STRONG' );
		expect( screen.getByText( ( _, element ) => element?.textContent === sentence ) ).toBeVisible();
	} );

	it( 'expands to every feature and collapses back', async () => {
		render( <LockedSection section="insights" /> );

		const toggle = screen.getByRole( 'button', { name: 'Show all Personal features' } );
		await userEvent.click( toggle );
		expect( screen.getAllByRole( 'listitem' ) ).toHaveLength( 11 );
		expect( toggle ).toHaveAttribute( 'aria-controls', screen.getAllByRole( 'list' )[ 1 ].id );

		await userEvent.click( screen.getByRole( 'button', { name: 'Show less' } ) );
		expect( screen.getAllByRole( 'listitem' ) ).toHaveLength( 4 );
	} );

	it( 'records the view once, each expand but not the collapse, and both links, naming the section', async () => {
		render( <LockedSection section="insights" /> );
		// jsdom cannot follow the links.
		const preventNavigation = ( event: MouseEvent ) => event.preventDefault();
		document.addEventListener( 'click', preventNavigation );

		await userEvent.click( screen.getByRole( 'button', { name: 'Show all Personal features' } ) );
		await userEvent.click( screen.getByRole( 'button', { name: 'Show less' } ) );
		await userEvent.click( screen.getByRole( 'button', { name: 'Show all Personal features' } ) );
		await userEvent.click( screen.getByRole( 'link', { name: /Learn more/ } ) );
		await userEvent.click( screen.getByRole( 'link', { name: 'Upgrade to Personal' } ) );
		document.removeEventListener( 'click', preventNavigation );

		const props = { section: 'insights', source: 'locked_section' };
		expect( recordEvent.mock.calls ).toEqual( [
			[ 'jetpack_premium_analytics_plan_upgrade_view', props ],
			[ 'jetpack_premium_analytics_plan_upgrade_expand', props ],
			[ 'jetpack_premium_analytics_plan_upgrade_expand', props ],
			[ 'jetpack_premium_analytics_plan_upgrade_learn_more_click', props ],
			[ 'jetpack_premium_analytics_plan_upgrade_click', props ],
		] );
	} );

	it( 'renders nothing for an open section', () => {
		const { container } = render( <LockedSection section="traffic" /> );

		expect( container ).toBeEmptyDOMElement();
		expect( recordEvent ).not.toHaveBeenCalled();
	} );
} );
