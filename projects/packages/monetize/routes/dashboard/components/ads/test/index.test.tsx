import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { wpcomFetch } from '../../../data/wpcom-fetch';
import Ads from '../index';

jest.mock( '@wordpress/api-fetch', () => ( { __esModule: true, default: jest.fn() } ) );
jest.mock( '@automattic/jetpack-script-data', () => ( { isSimpleSite: () => false } ) );
jest.mock( '../../../data/state', () => ( {
	getPageData: () => ( { upgradeUrl: 'https://example.com/upgrade', tracks: false } ),
	getSectionState: () => ( { hasWordAds: mockHasWordAds } ),
} ) );
jest.mock( '../../../data/wpcom-fetch', () => ( { wpcomFetch: jest.fn() } ) );

let mockHasWordAds = false;

const renderTab = ( {
	hasWordAds,
	active,
	paypal = 'me@example.com',
	totalEarnings = 0,
}: {
	hasWordAds: boolean;
	active: boolean;
	paypal?: string;
	totalEarnings?: number;
} ) => {
	mockHasWordAds = hasWordAds;
	// Only the settings read answers, so the plan stays what PHP printed.
	( apiFetch as unknown as jest.Mock ).mockImplementation( ( { path } ) =>
		path === '/jetpack/v4/settings' ? Promise.resolve( { wordads: active } ) : Promise.reject()
	);
	( wpcomFetch as jest.Mock ).mockImplementation( ( { path } ) => {
		const responses: Record< string, unknown > = {
			'wordads/account': { approved: active, active, unsafe: false },
			'wordads/earnings': { earnings: { total_earnings: totalEarnings, total_amount_owed: 0 } },
			'wordads/payments': { payments: [] },
			'wordads/settings': { settings: { paypal } },
		};
		return Promise.resolve( responses[ path ] );
	} );
	render(
		<QueryClientProvider client={ new QueryClient() }>
			<Ads openTab={ jest.fn() } />
		</QueryClientProvider>
	);
};

describe( 'Ads', () => {
	it.each( [
		[ 'no plan, ads off', { hasWordAds: false, active: false }, 'Upgrade and start earning' ],
		[ 'a plan, ads off', { hasWordAds: true, active: false }, 'Start earning from ads' ],
		[ 'ads on, no PayPal', { hasWordAds: true, active: true, paypal: '' }, /are held until/ ],
		[ 'ads on, plan lost', { hasWordAds: false, active: true }, /no longer includes ads/ ],
		[
			'ads off, owed earnings',
			{ hasWordAds: true, active: false, totalEarnings: 5 },
			'Ad earnings',
		],
	] )( 'with %s, shows the right card', async ( _case, state, text ) => {
		renderTab( state );

		await expect( screen.findByText( text ) ).resolves.toBeVisible();
	} );

	it( 'hides earnings from a site that never showed ads', async () => {
		renderTab( { hasWordAds: true, active: false } );

		await expect( screen.findByText( 'Start earning from ads' ) ).resolves.toBeVisible();
		expect( screen.queryByText( 'Ad earnings' ) ).not.toBeInTheDocument();
	} );
} );
