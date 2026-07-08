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
	} );

	it( 'requests the plan-usage endpoint and renders the usage figures', async () => {
		render( <PlanUsageWidget attributes={ {} } /> );

		await expect(
			screen.findByText( '6,200 / 10,000 billable views' )
		).resolves.toBeInTheDocument();
		expect( screen.getByText( 'Restarts in 12 days' ) ).toBeInTheDocument();

		const requestedPath = mockApiFetch.mock.calls[ 0 ][ 0 ].path as string;
		expect( requestedPath ).toContain( '/proxy/v2/jetpack-stats/usage' );
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

	it( 'renders no over-limit warning when the site is within its limit', async () => {
		mockApiFetch.mockResolvedValue( { ...PLAN_USAGE_RESPONSE, over_limit_months: 0 } );

		render( <PlanUsageWidget attributes={ {} } /> );

		await expect(
			screen.findByText( '6,200 / 10,000 billable views' )
		).resolves.toBeInTheDocument();
		expect( screen.queryByText( /surpassed your limit/ ) ).not.toBeInTheDocument();
	} );

	it( 'does not render the refetch overlay on the first populated render', async () => {
		render( <PlanUsageWidget attributes={ {} } /> );

		await expect(
			screen.findByText( '6,200 / 10,000 billable views' )
		).resolves.toBeInTheDocument();
		// The initial-load overlay is gone and no background refetch is running.
		// The overlay's spinner is the only `presentation`-role element on screen.
		expect( screen.queryByRole( 'presentation', { hidden: true } ) ).not.toBeInTheDocument();
	} );

	it( 'layers the loading overlay over the gauge during a background refetch', async () => {
		let resolveRefetch: ( value: unknown ) => void = () => {};
		// First call populates the gauge; the background refetch stays pending so
		// the overlay is observable while stale figures remain visible.
		mockApiFetch.mockResolvedValueOnce( PLAN_USAGE_RESPONSE ).mockImplementationOnce(
			() =>
				new Promise( resolve => {
					resolveRefetch = resolve;
				} )
		);

		render( <PlanUsageWidget attributes={ {} } /> );

		await expect(
			screen.findByText( '6,200 / 10,000 billable views' )
		).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'presentation', { hidden: true } ) ).not.toBeInTheDocument();

		// Kick off a background refetch; placeholderData keeps the stale gauge mounted.
		await act( async () => {
			queryClient.refetchQueries();
		} );

		// The overlay spinner (role="presentation") layers over the gauge.
		await expect(
			screen.findByRole( 'presentation', { hidden: true } )
		).resolves.toBeInTheDocument();
		// The stale figures stay visible beneath the overlay.
		expect( screen.getByText( '6,200 / 10,000 billable views' ) ).toBeInTheDocument();

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
		expect( screen.queryByText( /billable views/ ) ).not.toBeInTheDocument();
	} );
} );
