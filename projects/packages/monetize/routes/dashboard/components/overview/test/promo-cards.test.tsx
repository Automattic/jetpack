import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { trackOverviewClick } from '../../../data/tracking';
import PromoCards from '../promo-cards';
import type { OverviewState } from '../state';

const mockState = jest.fn< OverviewState, [] >();
let mockSimple = false;

jest.mock( '@wordpress/api-fetch', () => ( { __esModule: true, default: jest.fn() } ) );
jest.mock( '@automattic/jetpack-script-data', () => ( {
	isSimpleSite: () => mockSimple,
	isWpcomPlatformSite: () => mockSimple,
} ) );
jest.mock( '../state', () => ( { getOverviewState: () => mockState() } ) );
jest.mock( '../../../data/state', () => ( {
	getPageData: () => ( { upgradeUrl: 'https://example.com/upgrade', tracks: true } ),
} ) );
jest.mock( '../../../data/tracking', () => ( { trackOverviewClick: jest.fn() } ) );

const mockedApiFetch = apiFetch as unknown as jest.Mock;

type Account = { active: boolean };

const base: OverviewState = {
	hasWordAds: false,
	isWordAdsActive: false,
	hasSimplePayments: true,
	upgradeCommission: 0.02,
};

/**
 * Render the cards with the given state and what WordPress.com reports now.
 *
 * @param state    - Overrides for the Overview state.
 * @param features - The active features.
 * @param account  - WordPress.com's Ads account, which makes the site a Simple one.
 * @return The openTab mock.
 */
function setup( state: Partial< OverviewState > = {}, features: string[] = [], account?: Account ) {
	mockSimple = Boolean( account );
	mockState.mockReturnValue( { ...base, ...state } );
	mockedApiFetch.mockImplementation( ( { path }: { path: string } ) =>
		Promise.resolve(
			path.includes( 'wordads/account' )
				? account
				: { data: JSON.stringify( { active: features } ) }
		)
	);
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
		[
			'ads are on',
			{ hasWordAds: true, isWordAdsActive: true },
			[],
			undefined,
			'View ad dashboard',
			'ads',
		],
		[ 'the plan includes ads', { hasWordAds: true }, [], undefined, 'Earn ad revenue', 'settings' ],
		[
			'ads were bought since the plan was cached',
			{},
			[ 'wordads' ],
			undefined,
			'Earn ad revenue',
			'settings',
		],
		[
			'WordPress.com runs ads on Simple',
			{ hasWordAds: true },
			[],
			{ active: true },
			'View ad dashboard',
			'ads',
		],
		[
			'WordPress.com has paused ads on Simple, whatever the module says',
			{ hasWordAds: true, isWordAdsActive: true },
			[],
			{ active: false },
			'Earn ad revenue',
			'settings',
		],
	] )(
		'when %s, the Ads card opens its tab',
		async ( _case, state, features, account, label, tab ) => {
			const openTab = setup( state, features, account );

			await userEvent.click( await screen.findByRole( 'button', { name: label } ) );

			expect( openTab ).toHaveBeenCalledWith( tab );
			expect( trackOverviewClick ).toHaveBeenCalledWith( 'ads', 'open' );
			expect( screen.queryByRole( 'link', { name: 'Upgrade' } ) ).not.toBeInTheDocument();
		}
	);

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
