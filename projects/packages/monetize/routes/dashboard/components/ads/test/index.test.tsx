import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { wpcomFetch } from '../../../data/wpcom-fetch';
import Ads from '../index';

jest.mock( '@wordpress/api-fetch', () => ( { __esModule: true, default: jest.fn() } ) );
jest.mock( '@automattic/jetpack-script-data', () => ( {
	isSimpleSite: () => mockSimple,
	isWpcomPlatformSite: () => mockSimple,
} ) );
jest.mock( '../../../data/state', () => ( {
	getPageData: () => ( { upgradeUrl: 'https://example.com/upgrade', tracks: false } ),
	getSectionState: () => ( { hasWordAds: mockHasWordAds, canJoinWordAds: false } ),
} ) );
jest.mock( '../../../data/wpcom-fetch', () => ( { wpcomFetch: jest.fn() } ) );

let mockHasWordAds = false;
let mockSimple = false;

const renderTab = ( {
	hasWordAds,
	active,
	approved = active,
	paypal = 'me@example.com',
	totalEarnings = 0,
	owed = 0,
	status = false,
	simple = false,
}: {
	hasWordAds: boolean;
	active: boolean;
	approved?: boolean;
	paypal?: string;
	totalEarnings?: number;
	owed?: number;
	status?: string | false;
	simple?: boolean;
} ) => {
	mockHasWordAds = hasWordAds;
	mockSimple = simple;
	// Only the settings read answers, so the plan stays what PHP printed.
	( apiFetch as unknown as jest.Mock ).mockImplementation( ( { path } ) =>
		path === '/jetpack/v4/settings' ? Promise.resolve( { wordads: active } ) : Promise.reject()
	);
	( wpcomFetch as jest.Mock ).mockImplementation( ( { path } ) => {
		const responses: Record< string, unknown > = {
			'wordads/account': { approved, active, unsafe: false, status },
			'wordads/earnings': {
				earnings: { total_earnings: totalEarnings, total_amount_owed: owed },
			},
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
		[
			'ads off, owed earnings, no PayPal',
			{ hasWordAds: true, active: false, paypal: '', totalEarnings: 5, owed: 5 },
			/are held until/,
		],
		[
			'ads on, plan lost',
			{ hasWordAds: false, active: true, status: 'ineligible' },
			/no longer includes ads/,
		],
		[
			'Simple, not the owner',
			{ hasWordAds: true, active: false, simple: true },
			'Only the site owner can join WordAds.',
		],
		[
			'Simple, joined, ads off',
			{ hasWordAds: true, active: false, approved: true, simple: true },
			'Turn on ads',
		],
		[
			'ads off, owed earnings',
			{ hasWordAds: true, active: false, totalEarnings: 5 },
			'Ad earnings',
		],
	] )( 'with %s, shows the right card', async ( _case, state, text ) => {
		renderTab( state );

		await expect( screen.findByText( text ) ).resolves.toBeVisible();
	} );

	it( 'keeps quiet about the plan for a site WordPress.com still serves ads on', async () => {
		renderTab( { hasWordAds: false, active: true, status: 'approved' } );

		await expect( screen.findByText( 'Ad earnings' ) ).resolves.toBeVisible();
		expect( screen.queryByText( /no longer includes ads/ ) ).not.toBeInTheDocument();
	} );

	it( 'hides earnings from a site that never showed ads', async () => {
		renderTab( { hasWordAds: true, active: false } );

		await expect( screen.findByText( 'Start earning from ads' ) ).resolves.toBeVisible();
		expect( screen.queryByText( 'Ad earnings' ) ).not.toBeInTheDocument();
	} );
} );
