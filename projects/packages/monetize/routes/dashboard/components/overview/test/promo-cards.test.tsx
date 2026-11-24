import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { ADS_SETTINGS_KEY } from '../../../data/ads-keys';
import { trackOverviewClick } from '../../../data/tracking';
import PromoCards from '../promo-cards';
import type { OverviewState } from '../state';

const mockState = jest.fn< OverviewState, [] >();
let mockSimple = false;
let referralLink = '';
const ENABLED_LINK = 'https://wordpress.com/refer/abc';

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
 * @param stored   - Whether ads are on in the Settings tab's cache, once it has loaded.
 * @return The openTab mock.
 */
function setup(
	state: Partial< OverviewState > = {},
	features: string[] = [],
	account?: Account | Promise< Account >,
	stored?: boolean
) {
	mockSimple = Boolean( account );
	mockState.mockReturnValue( { ...base, ...state } );
	mockedApiFetch.mockImplementation( ( { path }: { path: string } ) => {
		if ( path.includes( 'peer-referral-link-enable' ) ) {
			return Promise.resolve( ENABLED_LINK );
		}
		if ( path.includes( 'peer-referral-link' ) ) {
			return Promise.resolve( referralLink );
		}
		return Promise.resolve(
			path.includes( 'wordads/account' )
				? account
				: { data: JSON.stringify( { active: features } ) }
		);
	} );
	const openTab = jest.fn();
	const client = new QueryClient( { defaultOptions: { queries: { retry: false } } } );
	if ( stored !== undefined ) {
		client.setQueryData( ADS_SETTINGS_KEY, { wordads: stored } );
	}
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

	it.each( [
		[ 'on', true, 'View ad dashboard', 'ads' ],
		[ 'off', false, 'Earn ad revenue', 'settings' ],
	] )(
		'when Settings has switched ads %s since the page loaded, the Ads card follows',
		async ( _case, stored, label, tab ) => {
			const openTab = setup(
				{ hasWordAds: true, isWordAdsActive: ! stored },
				[],
				undefined,
				stored
			);

			await userEvent.click( await screen.findByRole( 'button', { name: label } ) );

			expect( openTab ).toHaveBeenCalledWith( tab );
		}
	);

	it( 'on Simple, the Ads card offers no way in until WordPress.com says whether ads are on', () => {
		setup( { hasWordAds: true }, [], new Promise( () => {} ) );

		expect(
			screen.queryByRole( 'button', { name: /ad revenue|ad dashboard/ } )
		).not.toBeInTheDocument();
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

	it( 'without referral state, there is no Refer a friend card', () => {
		setup();

		expect( screen.queryByRole( 'heading', { name: 'Refer a friend' } ) ).not.toBeInTheDocument();
	} );

	it( 'without an annual plan, Refer a friend offers the annual plans and never asks for a link', async () => {
		// The Ads card has the plan, so this is the only Upgrade link.
		setup( {
			hasWordAds: true,
			referral: { eligible: false, upgradeUrl: 'https://wordpress.com/plans/yearly/a' },
		} );

		await expect( screen.findByRole( 'link', { name: 'Upgrade' } ) ).resolves.toHaveAttribute(
			'href',
			'https://wordpress.com/plans/yearly/a'
		);
		expect( mockedApiFetch ).not.toHaveBeenCalledWith(
			expect.objectContaining( { path: expect.stringContaining( 'peer-referral' ) } )
		);
	} );

	it( 'with an annual plan, Refer a friend turns referrals on and then shows the link', async () => {
		setup( { referral: { eligible: true, upgradeUrl: '' } } );

		await userEvent.click( await screen.findByRole( 'button', { name: 'Earn free credits' } ) );

		await expect(
			screen.findByRole( 'textbox', { name: 'Your referral link' } )
		).resolves.toHaveValue( ENABLED_LINK );
		expect( mockedApiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( {
				path: '/jetpack/v4/monetize/wpcom/v2/me/peer-referral-link-enable',
				method: 'POST',
				data: { enable: true },
			} )
		);
		expect( screen.queryByRole( 'button', { name: 'Earn free credits' } ) ).not.toBeInTheDocument();
	} );

	it( 'with an annual plan and a link already, Refer a friend shows it straight away', async () => {
		referralLink = ENABLED_LINK;
		setup( { referral: { eligible: true, upgradeUrl: '' } } );

		await expect(
			screen.findByRole( 'textbox', { name: 'Your referral link' } )
		).resolves.toHaveValue( ENABLED_LINK );
		expect( screen.queryByRole( 'button', { name: 'Earn free credits' } ) ).not.toBeInTheDocument();
		referralLink = '';
	} );
} );
