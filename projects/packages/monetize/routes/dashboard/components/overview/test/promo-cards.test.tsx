import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { trackOverviewClick } from '../../../data/tracking';
import PromoCards from '../promo-cards';
import type { OverviewState } from '../state';

const mockState = jest.fn< OverviewState, [] >();

jest.mock( '@wordpress/api-fetch', () => ( { __esModule: true, default: jest.fn() } ) );
jest.mock( '../state', () => ( { getOverviewState: () => mockState() } ) );
jest.mock( '../../../data/state', () => ( {
	getPageData: () => ( { upgradeUrl: 'https://example.com/upgrade', tracks: true } ),
} ) );
jest.mock( '../../../data/tracking', () => ( { trackOverviewClick: jest.fn() } ) );

const mockedApiFetch = apiFetch as unknown as jest.Mock;

const base: OverviewState = {
	hasWordAds: false,
	isWordAdsActive: false,
	hasSimplePayments: true,
	upgradeCommission: 0.02,
};

/**
 * Render the cards with the given state and the features WordPress.com reports now.
 *
 * @param state    - Overrides for the Overview state.
 * @param features - The active features.
 * @return The openTab mock.
 */
function setup( state: Partial< OverviewState > = {}, features: string[] = [] ) {
	mockState.mockReturnValue( { ...base, ...state } );
	mockedApiFetch.mockResolvedValue( { data: JSON.stringify( { active: features } ) } );
	const openTab = jest.fn();
	const client = new QueryClient( { defaultOptions: { queries: { retry: false } } } );
	render(
		<QueryClientProvider client={ client }>
			<PromoCards openTab={ openTab } />
		</QueryClientProvider>
	);
	return openTab;
}

describe( 'PromoCards', () => {
	it.each( [
		[ 'ads are on', { hasWordAds: true, isWordAdsActive: true }, [], 'View ad dashboard', 'ads' ],
		[ 'the plan includes ads', { hasWordAds: true }, [], 'Earn ad revenue', 'settings' ],
		[
			'ads were bought since the plan was cached',
			{},
			[ 'wordads' ],
			'Earn ad revenue',
			'settings',
		],
	] )( 'when %s, the Ads card opens its tab', async ( _case, state, features, label, tab ) => {
		const openTab = setup( state, features );

		await userEvent.click( await screen.findByRole( 'button', { name: label } ) );

		expect( openTab ).toHaveBeenCalledWith( tab );
		expect( trackOverviewClick ).toHaveBeenCalledWith( 'ads', 'open' );
		expect( screen.queryByRole( 'link', { name: 'Upgrade' } ) ).not.toBeInTheDocument();
	} );

	it( 'without ads in the plan, the Ads card offers the upgrade', async () => {
		setup();

		await expect( screen.findByRole( 'link', { name: 'Upgrade' } ) ).resolves.toHaveAttribute(
			'href',
			'https://example.com/upgrade'
		);
		expect(
			screen.getByText( 'Available with Jetpack Creator, or a bundled plan.' )
		).toBeVisible();
	} );
} );
