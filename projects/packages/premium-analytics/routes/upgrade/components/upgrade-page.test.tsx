/**
 * External dependencies
 */
import { AnalyticsQueryClientProvider, queryClient } from '@jetpack-premium-analytics/data';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
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
jest.mock( '@wordpress/route', () => ( {
	Link: jest.requireActual( '../../../tests/js/route-test-utils' ).mockWordPressRoute.Link,
	useSearch: () => ( {} ),
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
 * @param purchases - The site's purchases.
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
			return Promise.resolve( purchases );
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

describe( 'UpgradePage', () => {
	beforeEach( () => {
		jest.useFakeTimers();
		queryClient.clear();
		mockApiFetch.mockReset();
	} );

	afterEach( () => {
		jest.useRealTimers();
		delete window.JetpackScriptData;
	} );

	it( 'links checkout to the tier picked on the slider, returning to refresh the plan', async () => {
		setScriptData( true );
		mockEndpoints();
		await renderPage();

		// eslint-disable-next-line testing-library/prefer-user-event -- user-event cannot move a range input.
		fireEvent.change( screen.getByRole( 'slider' ), { target: { value: '1' } } );

		const checkout = new URL(
			screen.getByRole( 'link', { name: 'Upgrade now and continue' } ).getAttribute( 'href' ) ?? ''
		);
		expect( checkout.pathname ).toBe( '/checkout/123/jetpack_stats_yearly:-q-100000' );
		expect( checkout.searchParams.get( 'redirect_to' ) ).toContain( 'jpa_purchased=1' );
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
	} );

	it.each( [
		[ 'plan usage', 'jetpack-stats/usage' ],
		[ 'purchases', 'upgrades' ],
	] )(
		'offers no checkout when %s cannot load, since it would sell the wrong tier',
		async ( _, path ) => {
			setScriptData( true );
			mockEndpoints( [], path );
			await renderPage();

			expect(
				within( screen.getByRole( 'main' ) ).getByText( /Unable to load plan tiers/ )
			).toBeInTheDocument();
			expect(
				screen.getByText( /Unable to load plan tiers/, { selector: '#a11y-speak-polite' } )
			).toBeInTheDocument();
			expect(
				screen.queryByRole( 'link', { name: 'Upgrade now and continue' } )
			).not.toBeInTheDocument();
		}
	);

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
	} );
} );
