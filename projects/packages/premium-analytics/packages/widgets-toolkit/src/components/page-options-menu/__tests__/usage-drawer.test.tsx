/**
 * External dependencies
 */
import { AnalyticsQueryClientProvider, queryClient } from '@jetpack-premium-analytics/data';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import { UsageDrawer } from '../usage-drawer';

const mockApiFetch = jest.fn();
const mockRecordEvent = jest.fn();

jest.mock( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: {
		setUser: jest.fn(),
		identifyUser: jest.fn(),
		assignSuperProps: jest.fn(),
		tracks: { recordEvent: ( ...args: unknown[] ) => mockRecordEvent( ...args ) },
	},
} ) );

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: ( ...args: unknown[] ) => mockApiFetch( ...args ),
} ) );

jest.mock( '@automattic/jetpack-script-data', () => ( {
	isSimpleSite: () => false,
	getScriptData: () => ( {
		site: { admin_url: 'https://example.com/wp-admin/', wpcom: { blog_id: 123456789 } },
	} ),
} ) );

const USAGE = {
	current_usage: { views_count: 6200, days_to_reset: 12 },
	views_limit: 10000,
	over_limit_months: 0,
};

/**
 * How many times Tracks recorded the given event.
 *
 * @param name - The event name.
 * @return The number of records.
 */
const recordsOf = ( name: string ) =>
	mockRecordEvent.mock.calls.filter( ( [ eventName ] ) => eventName === name ).length;

/**
 * Renders the open drawer inside the query provider the page options menu gives it.
 *
 * @return The `userEvent` session.
 */
function showDrawer() {
	render(
		<AnalyticsQueryClientProvider>
			<UsageDrawer open onClose={ () => {} } source="menu" />
		</AnalyticsQueryClientProvider>
	);
	return userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
}

beforeEach( () => {
	jest.useFakeTimers();
	mockApiFetch.mockReset();
	mockRecordEvent.mockReset();
	mockApiFetch.mockImplementation( () => Promise.resolve( USAGE ) );
} );

afterEach( () => {
	queryClient.clear();
	jest.useRealTimers();
} );

describe( 'UsageDrawer', () => {
	it( 'shows the cycle usage and sends Upgrade to the Stats purchase screen for this site', async () => {
		showDrawer();

		await expect( screen.findByText( '6,200 / 10,000 views' ) ).resolves.toBeInTheDocument();
		expect( screen.getByText( 'Restarts in 12 days' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: 'Upgrade' } ) ).toHaveAttribute(
			'href',
			expect.stringContaining(
				'https://example.com/wp-admin/admin.php?page=stats#!/stats/purchase/123456789'
			)
		);
	} );

	it( 'reports one opening, not one per data refresh', async () => {
		showDrawer();

		await expect( screen.findByText( '6,200 / 10,000 views' ) ).resolves.toBeInTheDocument();
		await act( () => queryClient.refetchQueries() );

		expect( recordsOf( 'jetpack_premium_analytics_usage_open' ) ).toBe( 1 );
	} );

	it( 'reports each Upgrade activation once, by click or by keyboard', async () => {
		const user = showDrawer();

		const upgrade = await screen.findByRole( 'link', { name: 'Upgrade' } );
		upgrade.addEventListener( 'click', event => event.preventDefault() );
		await user.click( upgrade );
		upgrade.focus();
		await user.keyboard( '{Enter}' );

		expect( recordsOf( 'jetpack_premium_analytics_usage_upgrade_click' ) ).toBe( 2 );
	} );

	it( 'reports a click on Learn more once', async () => {
		const user = showDrawer();

		await user.click( await screen.findByRole( 'link', { name: /Learn more/ } ) );

		expect( recordsOf( 'jetpack_premium_analytics_usage_learn_more_click' ) ).toBe( 1 );
	} );

	it( 'offers no meter and no Upgrade on a plan without a views limit', async () => {
		mockApiFetch.mockImplementation( () =>
			Promise.resolve( { ...USAGE, views_limit: null, over_limit_months: null } )
		);
		showDrawer();

		await expect(
			screen.findByText( "Plan usage isn't available for your current plan." )
		).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'progressbar' ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'link', { name: 'Upgrade' } ) ).not.toBeInTheDocument();
	} );

	it( 'warns once the site went over its limit', async () => {
		mockApiFetch.mockImplementation( () => Promise.resolve( { ...USAGE, over_limit_months: 1 } ) );
		showDrawer();

		await expect(
			screen.findByText( "You've surpassed your limit the past month." )
		).resolves.toBeInTheDocument();
	} );

	it( 'says the usage could not be loaded when the request fails', async () => {
		mockApiFetch.mockImplementation( () =>
			Promise.reject( { code: 'api_error', data: { status: 403 } } )
		);
		showDrawer();

		await expect(
			within( screen.getByRole( 'dialog', { name: 'Usage' } ) ).findByText(
				"We couldn't load plan usage. Close this panel and try again."
			)
		).resolves.toBeInTheDocument();
	} );
} );
