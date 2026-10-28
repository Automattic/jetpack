/**
 * External dependencies
 */
import { AnalyticsQueryClientProvider, queryClient } from '@jetpack-premium-analytics/data';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import { UpgradePage } from './upgrade-page';
import type { ReactNode } from 'react';

jest.mock(
	'@automattic/jetpack-analytics',
	() => jest.requireActual( '../../../tests/js/analytics-test-utils' ).mockJetpackAnalytics
);
jest.mock( '@wordpress/api-fetch', () => jest.fn() );
const mockSpeak = jest.fn();
jest.mock( '@wordpress/a11y', () => ( {
	speak: ( ...args: unknown[] ) => mockSpeak( ...args ),
} ) );
const mockHandleConnectUser = jest.fn();
jest.mock( '@automattic/jetpack-connection', () => ( {
	useConnection: () => ( { handleConnectUser: mockHandleConnectUser, userIsConnecting: false } ),
} ) );
const mockSearch = jest.fn( () => ( {} ) );
jest.mock( '@wordpress/route', () => ( {
	Link: jest.requireActual( '../../../tests/js/route-test-utils' ).mockWordPressRoute.Link,
	useSearch: () => mockSearch(),
} ) );
jest.mock( '@wordpress/admin-ui', () => ( {
	Breadcrumbs: () => null,
	Page: ( { children }: { children: ReactNode } ) => <main>{ children }</main>,
} ) );

const mockApiFetch = apiFetch as unknown as jest.Mock;

const PRICE_TIERS = [ 10000, 100000, 250000 ].map( ( maximum_units, index ) => ( {
	minimum_units: 0,
	maximum_units,
	minimum_price: ( index + 1 ) * 10000,
	maximum_price: ( index + 1 ) * 10000,
	minimum_price_display: '',
	minimum_price_monthly_display: '',
	maximum_price_display: null,
	maximum_price_monthly_display: null,
} ) );

/**
 * Answers the page's requests: the tier prices, plan usage and purchases.
 *
 * @param purchases - The site's purchases, active unless they say otherwise.
 * @param failing   - A path fragment whose request fails.
 * @param usage     - The plan usage reply.
 */
function mockEndpoints(
	purchases: object[] = [],
	failing?: string,
	usage: object = { views_limit: null, billable_monthly_views: 0, current_usage: {} }
) {
	mockApiFetch.mockImplementation( ( { path }: { path: string } ) => {
		if ( failing && path.includes( failing ) ) {
			return Promise.reject( { code: 'api_error', data: { status: 502 } } );
		}
		if ( path.includes( '/products' ) ) {
			return Promise.resolve( {
				jetpack_stats_yearly: {
					product_slug: 'jetpack_stats_yearly',
					currency_code: 'USD',
					price_tier_list: PRICE_TIERS,
				},
			} );
		}
		if ( path.includes( 'jetpack-stats/usage' ) ) {
			return Promise.resolve( usage );
		}
		if ( path.includes( 'upgrades' ) ) {
			return Promise.resolve(
				purchases.map( purchase => ( { subscription_status: 'active', ...purchase } ) )
			);
		}
		return Promise.reject( new Error( `Unexpected request: ${ path }` ) );
	} );
}

/**
 * Seeds a connected Jetpack site.
 *
 * @param isUserConnected - Whether the current user's WordPress.com account is connected.
 */
function setScriptData( isUserConnected: boolean ) {
	window.JetpackScriptData = {
		site: {
			admin_url: 'https://example.com/wp-admin/',
			suffix: 'example.com',
			wpcom: { blog_id: 123 },
		},
		connection: { connectionStatus: { isRegistered: true, isUserConnected } },
	} as unknown as typeof window.JetpackScriptData;
}

/**
 * Renders the page and settles its requests.
 */
async function renderPage() {
	render(
		<AnalyticsQueryClientProvider>
			<UpgradePage />
		</AnalyticsQueryClientProvider>
	);
	await act( () => jest.runAllTimersAsync() );
}

/**
 * Reads the checkout link.
 *
 * @return The checkout URL.
 */
function getCheckoutUrl(): URL {
	return new URL(
		screen.getByRole( 'link', { name: 'Upgrade now and continue' } ).getAttribute( 'href' ) ?? ''
	);
}

describe( 'UpgradePage', () => {
	beforeEach( () => {
		jest.useFakeTimers();
		queryClient.clear();
		mockApiFetch.mockReset();
		mockHandleConnectUser.mockReset();
		// The real flow leaves the page, so its promise does not settle.
		mockHandleConnectUser.mockReturnValue( new Promise( () => {} ) );
		mockSpeak.mockReset();
		mockSearch.mockReturnValue( {} );
	} );

	afterEach( () => {
		jest.useRealTimers();
		delete window.JetpackScriptData;
	} );

	it( 'links checkout to the tier picked on the slider', async () => {
		setScriptData( true );
		mockEndpoints();
		await renderPage();

		// eslint-disable-next-line testing-library/prefer-user-event -- user-event cannot move a range input.
		fireEvent.change( screen.getByRole( 'slider' ), { target: { value: '1' } } );

		const checkout = new URL(
			screen.getByRole( 'link', { name: 'Upgrade now and continue' } ).getAttribute( 'href' ) ?? ''
		);
		expect( checkout.pathname ).toBe( '/checkout/123/jetpack_stats_yearly:-q-100000' );
	} );

	it( 'asks a site that holds a Stats plan to connect the user before upgrading', async () => {
		setScriptData( false );
		mockEndpoints( [
			{ product_slug: 'jetpack_stats_free_yearly', is_jetpack_stats_product: true },
		] );
		await renderPage();

		expect(
			screen.getByText( 'Please connect your user account to upgrade Stats.' )
		).toBeInTheDocument();
		expect(
			screen.queryByRole( 'link', { name: 'Upgrade now and continue' } )
		).not.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Upgrade now and continue' } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);

		const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
		await user.click( screen.getByRole( 'button', { name: 'Connect your account' } ) );
		expect( mockHandleConnectUser ).toHaveBeenCalled();
	} );

	it( 'offers no checkout until purchases load, since they decide between a new purchase and an upgrade', async () => {
		setScriptData( true );
		mockEndpoints();
		const answer = mockApiFetch.getMockImplementation() as ( req: { path: string } ) => unknown;
		mockApiFetch.mockImplementation( ( req: { path: string } ) =>
			req.path.includes( 'upgrades' ) ? new Promise( () => {} ) : answer( req )
		);
		await renderPage();

		expect( screen.getByRole( 'button', { name: 'Upgrade now and continue' } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );

	it.each( [
		[ 'plan usage', 'jetpack-stats/usage', /Unable to load plan tiers/ ],
		[ 'purchases', 'upgrades', /Unable to load your current purchases/ ],
	] )(
		'offers no checkout when %s cannot load, since it would sell the wrong tier',
		async ( _, path, message ) => {
			setScriptData( true );
			mockEndpoints( [], path );
			await renderPage();

			expect( within( screen.getByRole( 'main' ) ).getByText( message ) ).toBeInTheDocument();
			expect( mockSpeak ).toHaveBeenCalledWith( expect.stringMatching( message ), 'polite' );
			expect(
				screen.queryByRole( 'link', { name: 'Upgrade now and continue' } )
			).not.toBeInTheDocument();
		}
	);

	it( 'says no tiers are on sale, not that the network failed, when the price list has no Stats tiers', async () => {
		setScriptData( true );
		mockEndpoints();
		const answer = mockApiFetch.getMockImplementation() as ( req: { path: string } ) => unknown;
		mockApiFetch.mockImplementation( ( req: { path: string } ) =>
			req.path.includes( '/products' ) ? Promise.resolve( {} ) : answer( req )
		);
		await renderPage();

		const message = 'No Stats tiers are available to buy for this site right now.';
		expect( screen.getByText( message ) ).toBeInTheDocument();
		expect( mockSpeak ).toHaveBeenCalledWith( message, 'polite' );
	} );

	it( 'stops the connect button and says so when the account connection cannot start', async () => {
		setScriptData( false );
		mockEndpoints( [
			{ product_slug: 'jetpack_stats_free_yearly', is_jetpack_stats_product: true },
		] );
		mockHandleConnectUser.mockRejectedValue( new Error( 'authorize_url failed' ) );
		await renderPage();

		const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
		await user.click( screen.getByRole( 'button', { name: 'Connect your account' } ) );
		await act( () => jest.runAllTimersAsync() );

		expect( screen.getByText( /Unable to start connecting your account/ ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Connect your account' } ) ).not.toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );

	it.each( [
		[ 'no purchases and a connected user', [], true, '/checkout/123/' ],
		[ 'no purchases and no connected user', [], false, '/checkout/jetpack/' ],
		[
			'the free Stats plan',
			[ { product_slug: 'jetpack_stats_free_yearly', is_jetpack_stats_product: true } ],
			true,
			'/checkout/example.com/',
		],
		[
			'Jetpack Complete only',
			[
				{
					product_slug: 'jetpack_complete',
					product_name: 'Jetpack Complete',
					is_jetpack_stats_product: true,
				},
			],
			true,
			'/checkout/example.com/',
		],
		[
			'a removed yearly tier',
			[
				{
					product_slug: 'jetpack_stats_yearly',
					is_jetpack_stats_product: true,
					subscription_status: 'inactive',
				},
			],
			true,
			'/checkout/123/',
		],
	] )(
		'sends a site with %s to the matching checkout',
		async ( _, purchases, isUserConnected, path ) => {
			setScriptData( isUserConnected );
			mockEndpoints( purchases );
			await renderPage();

			expect( getCheckoutUrl().pathname.startsWith( path ) ).toBe( true );
		}
	);

	it.each( [
		[ 'jetpack_stats_monthly', true ],
		[ 'jetpack_stats_yearly', true ],
		[ 'jetpack_stats_bi_yearly', true ],
		[ 'jetpack_stats_free_yearly', false ],
		[ 'jetpack_stats_pwyw_yearly', false ],
	] )( 'treats %s as a paid tier to credit: %s', async ( slug, credited ) => {
		setScriptData( true );
		mockEndpoints( [ { product_slug: slug, is_jetpack_stats_product: true } ] );
		await renderPage();

		expect( screen.queryByText( /will be credited towards the upgrade/ ) !== null ).toBe(
			credited
		);
		expect( screen.queryByText( 'Real-time data on visitors' ) === null ).toBe( credited );
	} );

	it( 'tells a site past the limit of its paid tier that the upgrade is credited, instead of pitching the benefits', async () => {
		setScriptData( true );
		mockEndpoints(
			[ { product_slug: 'jetpack_stats_yearly', is_jetpack_stats_product: true } ],
			undefined,
			{
				views_limit: 10000,
				billable_monthly_views: 12000,
				current_tier: { minimum_price: 10000, limit: 10000 },
				current_usage: { views_count: 12000 },
			}
		);
		await renderPage();

		expect( screen.getByText( /will be credited towards the upgrade/ ) ).toBeInTheDocument();
		expect( screen.getByText( /Your site has reached its views limit/ ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Real-time data on visitors' ) ).not.toBeInTheDocument();
		// Cross-grades only work on the site checkout, not the blog-id one a new purchase uses.
		expect( getCheckoutUrl().pathname ).toMatch( /^\/checkout\/example\.com\// );
	} );

	it( 'still tells a site with a bundled plan and a paid tier that the plan views stack, without a count that includes both', async () => {
		setScriptData( true );
		mockEndpoints(
			[
				{
					product_slug: 'jetpack_complete',
					product_name: 'Jetpack Complete',
					is_jetpack_stats_product: true,
				},
				{ product_slug: 'jetpack_stats_yearly', is_jetpack_stats_product: true },
			],
			undefined,
			{
				views_limit: 110000,
				billable_monthly_views: 1000,
				current_tier: { minimum_price: 10000, limit: 10000 },
				current_usage: { views_count: 1000 },
			}
		);
		await renderPage();

		expect(
			screen.getByText(
				'Your Jetpack Complete plan already includes views for Stats. Views from this purchase will stack on top, so you keep what you already have.'
			)
		).toBeInTheDocument();
	} );

	it.each( [ 'jetpack_pro_yearly', 'jetpack_pro_bi_yearly' ] )(
		'tells a %s site how many views its plan already includes',
		async productSlug => {
			setScriptData( true );
			mockEndpoints( [ { product_slug: productSlug, product_name: 'Jetpack Pro' } ], undefined, {
				views_limit: 50000,
				billable_monthly_views: 60000,
				current_usage: { views_count: 60000 },
			} );
			await renderPage();

			expect(
				screen.getByText(
					'Your Jetpack Pro plan already includes 50K views per month for Stats. Views from this purchase will stack on top, so you keep what you already have.'
				)
			).toBeInTheDocument();
		}
	);

	it( 'returns from checkout to the upgrade page with the report window and tab it was opened with', async () => {
		mockSearch.mockReturnValue( {
			from: '2026-10-01',
			to: '2026-10-07',
			ds: 'traffic',
			source: 'locked',
		} );
		setScriptData( true );
		mockEndpoints();
		await renderPage();

		const back = new URL( getCheckoutUrl().searchParams.get( 'checkoutBackUrl' ) ?? '' );
		expect( back.searchParams.get( 'p' ) ).toBe(
			'/upgrade?from=2026-10-01&to=2026-10-07&ds=traffic&source=locked'
		);
	} );
} );
