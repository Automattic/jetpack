import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { trackOverviewClick } from '../../../data/tracking';
import PromoCards from '../promo-cards';
import type { OverviewState } from '../state';

const mockState = jest.fn< OverviewState, [] >();

jest.mock( '../state', () => ( { getOverviewState: () => mockState() } ) );
jest.mock( '../../../data/memberships', () => ( {
	useIsStripeConnected: () => ( { data: false } ),
} ) );
jest.mock( '../../../data/tracking', () => ( { trackOverviewClick: jest.fn() } ) );

const base: OverviewState = {
	hasWordAds: false,
	isWordAdsActive: false,
	hasSimplePayments: true,
	upgradeUrl: 'https://example.com/upgrade',
};

describe( 'PromoCards', () => {
	it.each( [
		[ 'ads are on', { hasWordAds: true, isWordAdsActive: true }, 'View ad dashboard', 'ads' ],
		[ 'the plan includes ads', { hasWordAds: true }, 'Earn ad revenue', 'settings' ],
	] )( 'when %s, the Ads card opens its tab', async ( _case, state, label, tab ) => {
		mockState.mockReturnValue( { ...base, ...state } );
		const openTab = jest.fn();
		render( <PromoCards canUseWpcom openTab={ openTab } /> );

		await userEvent.click( screen.getByRole( 'button', { name: label } ) );

		expect( openTab ).toHaveBeenCalledWith( tab );
		expect( trackOverviewClick ).toHaveBeenCalledWith( 'ads', 'open' );
		expect( screen.queryByRole( 'link', { name: 'Upgrade' } ) ).not.toBeInTheDocument();
	} );

	it( 'without ads in the plan, the Ads card offers the upgrade', () => {
		mockState.mockReturnValue( base );
		render( <PromoCards canUseWpcom openTab={ jest.fn() } /> );

		expect( screen.getByRole( 'link', { name: 'Upgrade' } ) ).toHaveAttribute(
			'href',
			base.upgradeUrl
		);
		expect(
			screen.getByText( 'Available with Jetpack Creator, or a bundled plan.' )
		).toBeVisible();
	} );
} );
