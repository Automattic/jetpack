/**
 * External dependencies
 */
import { queryClient } from '@jetpack-premium-analytics/data';
import { act, render, screen } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import PlanUsageWidget from '../render';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

// WidgetRoot reads URL search params as a fallback for report params; outside
// a matched route the real hook warns and throws.
jest.mock( '@wordpress/route', () => ( {
	useSearch: () => ( {} ),
} ) );

const mockApiFetch = apiFetch as unknown as jest.Mock;

const PLAN_USAGE_RESPONSE = {
	current_usage: {
		current_start: '2026-06-01',
		next_start: '2026-07-01',
		views_count: 6200,
		days_to_reset: 12,
	},
	recent_usages: [],
	views_limit: 10000,
	over_limit_months: 0,
	current_tier: {},
	is_internal: false,
	billable_monthly_views: 6200,
	should_show_paywall: false,
	paywall_date_from: null,
	upgrade_deadline_date: null,
};

describe( 'PlanUsageWidget', () => {
	beforeEach( () => {
		// The data package's query client is a module-level singleton; drop its
		// cache so each test starts from a fresh fetch.
		queryClient.clear();
		mockApiFetch.mockReset();
		mockApiFetch.mockResolvedValue( PLAN_USAGE_RESPONSE );
		// The upgrade note builds its purchase URL from the script data wp-admin
		// prints on the page.
		window.JetpackScriptData = {
			site: {
				admin_url: 'https://example.com/wp-admin/',
				wpcom: { blog_id: 123456789 },
			},
		} as typeof window.JetpackScriptData;
	} );

	it( 'requests the plan-usage endpoint and renders the usage figures', async () => {
		render( <PlanUsageWidget attributes={ {} } /> );

		await expect( screen.findByText( '6,200 / 10,000 views' ) ).resolves.toBeInTheDocument();
		expect( screen.getByText( 'Restarts in 12 days' ) ).toBeInTheDocument();

		const requestedPath = mockApiFetch.mock.calls[ 0 ][ 0 ].path as string;
		expect( requestedPath ).toContain( '/proxy/v2/jetpack-stats/usage' );
	} );

	it( 'fills the meter proportionally to the usage figures', async () => {
		render( <PlanUsageWidget attributes={ {} } /> );

		const meter = ( await screen.findByRole( 'progressbar' ) ) as HTMLProgressElement;
		expect( meter.value ).toBe( 6200 );
		expect( meter.max ).toBe( 10000 );
	} );

	it( 'links the upgrade note to the Stats purchase screen for the connected site', async () => {
		render( <PlanUsageWidget attributes={ {} } /> );

		const upgradeLink = await screen.findByRole( 'link', { name: 'Upgrade now' } );
		expect( upgradeLink ).toHaveAttribute(
			'href',
			expect.stringContaining(
				'https://example.com/wp-admin/admin.php?page=stats#!/stats/purchase/123456789'
			)
		);
		expect( screen.getByText( /Do you want to increase your views limit\?/ ) ).toBeInTheDocument();
	} );

	// The warning is driven solely by `over_limit_months`, independent of the
	// current cycle's usage.
	it( 'shows the multi-cycle warning when over the limit for two or more periods', async () => {
		mockApiFetch.mockResolvedValue( { ...PLAN_USAGE_RESPONSE, over_limit_months: 2 } );

		render( <PlanUsageWidget attributes={ {} } /> );

		await expect(
			screen.findByText( "You've surpassed your limit for two consecutive periods already." )
		).resolves.toBeInTheDocument();
	} );

	it( 'shows the single-cycle warning when over the limit for one period', async () => {
		mockApiFetch.mockResolvedValue( { ...PLAN_USAGE_RESPONSE, over_limit_months: 1 } );

		render( <PlanUsageWidget attributes={ {} } /> );

		await expect(
			screen.findByText( "You've surpassed your limit the past month." )
		).resolves.toBeInTheDocument();
	} );

	// VIP sites aren't held to the billable-views limit, so the over-limit
	// warning is suppressed even when `over_limit_months` reports lapses.
	it( 'suppresses the over-limit warning on VIP sites', async () => {
		mockApiFetch.mockResolvedValue( { ...PLAN_USAGE_RESPONSE, over_limit_months: 2 } );
		window.JetpackScriptData = {
			site: {
				admin_url: 'https://example.com/wp-admin/',
				host: 'vip',
				wpcom: { blog_id: 123456789 },
			},
		} as typeof window.JetpackScriptData;

		render( <PlanUsageWidget attributes={ {} } /> );

		await expect( screen.findByText( '6,200 / 10,000 views' ) ).resolves.toBeInTheDocument();
		expect( screen.queryByText( /surpassed your limit/ ) ).not.toBeInTheDocument();
	} );

	it( 'renders no over-limit warning when the site is within its limit', async () => {
		mockApiFetch.mockResolvedValue( { ...PLAN_USAGE_RESPONSE, over_limit_months: 0 } );

		render( <PlanUsageWidget attributes={ {} } /> );

		await expect( screen.findByText( '6,200 / 10,000 views' ) ).resolves.toBeInTheDocument();
		expect( screen.queryByText( /surpassed your limit/ ) ).not.toBeInTheDocument();
	} );

	it( 'does not render the refetch overlay on the first populated render', async () => {
		render( <PlanUsageWidget attributes={ {} } /> );

		await expect( screen.findByText( '6,200 / 10,000 views' ) ).resolves.toBeInTheDocument();
		// The initial-load overlay is gone and no background refetch is running.
		// The overlay's spinner is the only `presentation`-role element on screen.
		expect( screen.queryByRole( 'presentation', { hidden: true } ) ).not.toBeInTheDocument();
	} );

	it( 'layers the loading overlay over the meter during a background refetch', async () => {
		let resolveRefetch: ( value: unknown ) => void = () => {};
		// First call populates the meter; the background refetch stays pending so
		// the overlay is observable while stale figures remain visible.
		mockApiFetch.mockResolvedValueOnce( PLAN_USAGE_RESPONSE ).mockImplementationOnce(
			() =>
				new Promise( resolve => {
					resolveRefetch = resolve;
				} )
		);

		render( <PlanUsageWidget attributes={ {} } /> );

		await expect( screen.findByText( '6,200 / 10,000 views' ) ).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'presentation', { hidden: true } ) ).not.toBeInTheDocument();

		// Kick off a background refetch; placeholderData keeps the stale meter mounted.
		await act( async () => {
			queryClient.refetchQueries();
		} );

		// The overlay spinner (role="presentation") layers over the meter.
		await expect(
			screen.findByRole( 'presentation', { hidden: true } )
		).resolves.toBeInTheDocument();
		// The stale figures stay visible beneath the overlay.
		expect( screen.getByText( '6,200 / 10,000 views' ) ).toBeInTheDocument();

		// Settle the pending refetch so the query resolves and the overlay clears.
		await act( async () => {
			resolveRefetch( PLAN_USAGE_RESPONSE );
		} );
	} );

	it( 'renders an unavailable state when the plan reports no limit', async () => {
		mockApiFetch.mockResolvedValue( { ...PLAN_USAGE_RESPONSE, views_limit: null } );

		render( <PlanUsageWidget attributes={ {} } /> );

		await expect(
			screen.findByText( "Plan usage isn't available for your current plan." )
		).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'progressbar' ) ).not.toBeInTheDocument();
		expect( screen.queryByText( /increase your views limit/ ) ).not.toBeInTheDocument();
	} );

	// A zero limit gives nothing to meter against (`max={0}` is degenerate), so
	// it renders as unavailable rather than an always-over-limit "X / 0" bar.
	it( 'renders an unavailable state when the plan reports a zero limit', async () => {
		mockApiFetch.mockResolvedValue( { ...PLAN_USAGE_RESPONSE, views_limit: 0 } );

		render( <PlanUsageWidget attributes={ {} } /> );

		await expect(
			screen.findByText( "Plan usage isn't available for your current plan." )
		).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'progressbar' ) ).not.toBeInTheDocument();
	} );

	it( 'omits the upgrade note when script data provides no purchase URL', async () => {
		// Without wp-admin script data there is no purchase URL to link to.
		window.JetpackScriptData = undefined as unknown as typeof window.JetpackScriptData;

		render( <PlanUsageWidget attributes={ {} } /> );

		await expect( screen.findByText( '6,200 / 10,000 views' ) ).resolves.toBeInTheDocument();
		expect( screen.queryByText( /increase your views limit/ ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'link', { name: 'Upgrade now' } ) ).not.toBeInTheDocument();
	} );

	it( 'renders the error state with a retry action when the request fails', async () => {
		// A 403-shaped rejection skips the query client's retries, so the error
		// state is reachable without waiting out the retry backoff.
		mockApiFetch.mockRejectedValue( { status: 403 } );

		render( <PlanUsageWidget attributes={ {} } /> );

		await expect(
			screen.findByText( "We couldn't load plan usage. Please try again in a moment." )
		).resolves.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Retry' } ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'progressbar' ) ).not.toBeInTheDocument();
	} );
} );
