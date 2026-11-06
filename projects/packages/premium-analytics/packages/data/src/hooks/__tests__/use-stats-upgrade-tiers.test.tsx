import { act, renderHook } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { AnalyticsQueryClientProvider, queryClient } from '../../providers/query-client-provider';
import { useStatsUpgradeTiers } from '../use-stats-upgrade-tiers';
import type { ReactNode } from 'react';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

const mockApiFetch = apiFetch as unknown as jest.Mock;

const PRODUCTS = {
	jetpack_stats_yearly: {
		product_slug: 'jetpack_stats_yearly',
		currency_code: 'EUR',
		price_tier_list: [ 10000, 100000, 250000 ].map( ( maximum_units, index ) => ( {
			minimum_units: 0,
			maximum_units,
			minimum_price: ( index + 1 ) * 10000,
			maximum_price: ( index + 1 ) * 10000,
			minimum_price_display: '',
			minimum_price_monthly_display: '',
			maximum_price_display: null,
			maximum_price_monthly_display: null,
		} ) ),
	},
};

const PURCHASED_100K = {
	views_limit: 100000,
	billable_monthly_views: 40000,
	current_tier: { minimum_price: 20000, limit: 100000 },
	current_usage: {},
};

/**
 * Answers the price list, and plan usage with the given reply.
 *
 * @param usage - The plan usage reply.
 */
function mockEndpoints( usage: () => Promise< unknown > ) {
	mockApiFetch.mockImplementation( ( { path }: { path: string } ) =>
		path.includes( 'jetpack-stats/usage' ) ? usage() : Promise.resolve( PRODUCTS )
	);
}

const wrapper = ( { children }: { children: ReactNode } ) => (
	<AnalyticsQueryClientProvider>{ children }</AnalyticsQueryClientProvider>
);

/**
 * Renders the hook and settles its requests.
 *
 * @return The render result.
 */
async function renderTiers() {
	const view = renderHook( () => useStatsUpgradeTiers(), { wrapper } );
	await act( () => jest.runAllTimersAsync() );
	return view;
}

describe( 'useStatsUpgradeTiers', () => {
	beforeEach( () => {
		jest.useFakeTimers();
		queryClient.clear();
		mockApiFetch.mockReset();
	} );

	afterEach( () => {
		jest.useRealTimers();
		delete window.JetpackScriptData;
	} );

	it( 'offers only the tiers above the purchased one, in the price list currency', async () => {
		mockEndpoints( () => Promise.resolve( PURCHASED_100K ) );

		const { result } = await renderTiers();

		expect( result.current.tiers.map( tier => tier.views ) ).toEqual( [ 250000 ] );
		expect( result.current.currencyCode ).toBe( 'EUR' );
	} );

	it( 'stays loading while plan usage is pending, so the purchased tiers are not offered yet', async () => {
		mockEndpoints( () => new Promise( () => {} ) );

		const { result } = await renderTiers();

		expect( result.current.isLoading ).toBe( true );
	} );

	it( 'reports a plan usage failure as an error, not as a full list of tiers', async () => {
		mockEndpoints( () => Promise.reject( { code: 'api_error', data: { status: 502 } } ) );

		const { result } = await renderTiers();

		expect( result.current.isError ).toBe( true );
	} );

	it( "prices the tiers in the user's checkout currency, not the one WordPress.com guesses for the site", async () => {
		window.JetpackScriptData = {
			connection: {
				userConnectionData: { currentUser: { wpcomUser: { avatar: false, user_currency: 'EUR' } } },
			},
		} as unknown as typeof window.JetpackScriptData;
		mockEndpoints( () => Promise.resolve( PURCHASED_100K ) );

		await renderTiers();

		const productsRequest = mockApiFetch.mock.calls.find( ( [ { path } ] ) =>
			path.includes( '/products' )
		);
		expect( productsRequest?.[ 0 ].path ).toContain( 'currency=EUR' );
	} );
} );
