import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
	getSectionState: () => ( { hasWordAds: mockHasWordAds, canJoinWordAds: mockCanJoin } ),
} ) );
jest.mock( '../../../data/wpcom-fetch', () => ( { wpcomFetch: jest.fn() } ) );
jest.mock( '../../../data/tracking' );

let mockHasWordAds = false;
let mockSimple = false;
let mockCanJoin = false;

const renderTab = ( {
	hasWordAds,
	active,
	approved = active,
	paypal = 'me@example.com',
	totalEarnings = 0,
	owed = 0,
	status = false,
	simple = false,
	canJoin = false,
	unsafe = false,
}: {
	hasWordAds: boolean;
	active: boolean;
	approved?: boolean;
	paypal?: string;
	totalEarnings?: number;
	owed?: number;
	status?: string | false;
	simple?: boolean;
	canJoin?: boolean;
	unsafe?: string | false;
} ) => {
	mockHasWordAds = hasWordAds;
	mockSimple = simple;
	mockCanJoin = canJoin;
	// Only the settings read answers, so the plan stays what PHP printed.
	( apiFetch as unknown as jest.Mock ).mockImplementation( ( { path } ) =>
		path === '/jetpack/v4/settings' ? Promise.resolve( { wordads: active } ) : Promise.reject()
	);
	( wpcomFetch as jest.Mock ).mockImplementation( ( { path } ) => {
		const responses: Record< string, unknown > = {
			'wordads/account': { approved, active, unsafe, status },
			'wordads/earnings': {
				earnings: { total_earnings: totalEarnings, total_amount_owed: owed },
			},
			'wordads/payments': { payments: [] },
			'wordads/settings': { settings: { paypal } },
		};
		return Promise.resolve( responses[ path ] );
	} );
	const openTab = jest.fn();
	render(
		<QueryClientProvider client={ new QueryClient() }>
			<Ads openTab={ openTab } />
		</QueryClientProvider>
	);
	return { openTab };
};

describe( 'Ads', () => {
	// The last column is text the card must not show.
	it.each( [
		[ 'no plan, ads off', { hasWordAds: false, active: false }, 'Upgrade and start earning', null ],
		[
			'a plan, ads off',
			{ hasWordAds: true, active: false },
			'Start earning from ads',
			'Ad earnings',
		],
		[
			'ads off, owed earnings, no PayPal',
			{ hasWordAds: true, active: false, paypal: '', totalEarnings: 5, owed: 5 },
			/are held until/,
			null,
		],
		[
			'ads on, plan lost',
			{ hasWordAds: false, active: true, status: 'ineligible' },
			/no longer includes ads/,
			null,
		],
		[
			'Simple, not the owner',
			{ hasWordAds: true, active: false, simple: true },
			'Only the site owner can join WordAds.',
			null,
		],
		[
			'Simple, the owner',
			{ hasWordAds: true, active: false, simple: true, canJoin: true },
			'Join WordAds in Settings',
			null,
		],
		[
			'Simple, joined, ads off',
			{ hasWordAds: true, active: false, approved: true, simple: true },
			'Turn on ads in Settings',
			null,
		],
		[
			'ads off, owed earnings',
			{ hasWordAds: true, active: false, totalEarnings: 5 },
			'Ad earnings',
			null,
		],
	] )( 'with %s, shows the right card', async ( _case, state, text, hidden ) => {
		renderTab( state );

		await expect( screen.findByText( text ) ).resolves.toBeVisible();
		expect( hidden ? screen.queryByText( hidden ) : null ).toBeNull();
	} );

	it( 'offers no way to join for a Simple site WordPress.com reports unsafe', async () => {
		renderTab( { hasWordAds: true, active: false, simple: true, canJoin: true, unsafe: 'spam' } );

		await expect( screen.findByText( 'Join WordAds' ) ).resolves.toBeVisible();
		expect(
			screen.queryByRole( 'link', { name: 'Join WordAds in Settings' } )
		).not.toBeInTheDocument();
	} );

	it( 'keeps quiet about the plan for a site WordPress.com still serves ads on', async () => {
		renderTab( { hasWordAds: false, active: true, status: 'approved' } );

		await expect( screen.findByText( 'Ad earnings' ) ).resolves.toBeVisible();
		expect( screen.queryByText( /no longer includes ads/ ) ).not.toBeInTheDocument();
	} );

	it( 'opens Settings in place to turn on ads', async () => {
		const { openTab } = renderTab( { hasWordAds: true, active: false } );

		await userEvent.click( await screen.findByRole( 'link', { name: 'Turn on ads in Settings' } ) );

		expect( openTab ).toHaveBeenCalledWith( 'settings' );
	} );
} );
