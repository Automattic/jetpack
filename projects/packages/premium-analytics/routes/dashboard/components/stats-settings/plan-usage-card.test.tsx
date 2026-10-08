import { AnalyticsQueryClientProvider, queryClient } from '@jetpack-premium-analytics/data';
import { render, screen } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { PlanUsageCard } from './plan-usage-card';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

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

const SITE = {
	admin_url: 'https://example.com/wp-admin/',
	wpcom: { blog_id: 123456789 },
};

const renderCard = () =>
	render(
		<AnalyticsQueryClientProvider>
			<PlanUsageCard />
		</AnalyticsQueryClientProvider>
	);

describe( 'PlanUsageCard', () => {
	beforeEach( () => {
		// The query client is a module-level singleton, so each test starts from a fresh fetch.
		queryClient.clear();
		mockApiFetch.mockReset();
		mockApiFetch.mockResolvedValue( PLAN_USAGE_RESPONSE );
		window.JetpackScriptData = { site: SITE } as typeof window.JetpackScriptData;
	} );

	afterEach( () => {
		delete window.JetpackScriptData;
	} );

	it( 'requests the plan-usage endpoint and shows the usage figures', async () => {
		renderCard();

		await expect( screen.findByText( '6,200 / 10,000 views' ) ).resolves.toBeInTheDocument();
		expect( screen.getByText( 'Restarts in 12 days' ) ).toBeInTheDocument();
		expect( mockApiFetch.mock.calls[ 0 ][ 0 ].path ).toContain( '/proxy/v2/jetpack-stats/usage' );
	} );

	it( 'fills the meter no further than the limit when usage exceeds it', async () => {
		mockApiFetch.mockResolvedValue( {
			...PLAN_USAGE_RESPONSE,
			current_usage: { ...PLAN_USAGE_RESPONSE.current_usage, views_count: 12000 },
		} );

		renderCard();

		const meter = await screen.findByRole( 'progressbar' );
		// eslint-disable-next-line jest-dom/prefer-to-have-value -- toHaveValue reads form controls only, not <progress>.
		expect( meter ).toHaveAttribute( 'value', '100' );
	} );

	it( 'links Upgrade to the Stats purchase screen for the connected site', async () => {
		renderCard();

		await expect( screen.findByRole( 'link', { name: 'Upgrade' } ) ).resolves.toHaveAttribute(
			'href',
			expect.stringContaining(
				'https://example.com/wp-admin/admin.php?page=stats#!/stats/purchase/123456789'
			)
		);
	} );

	it( 'leaves out Upgrade when the script data has no site to buy for', async () => {
		delete window.JetpackScriptData;

		renderCard();

		await expect( screen.findByText( '6,200 / 10,000 views' ) ).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'link', { name: 'Upgrade' } ) ).not.toBeInTheDocument();
	} );

	it.each( [
		[ 2, "You've surpassed your limit for two consecutive periods already." ],
		[ 1, "You've surpassed your limit the past month." ],
	] )( 'warns after %d periods over the limit', async ( overLimitMonths, warning ) => {
		mockApiFetch.mockResolvedValue( {
			...PLAN_USAGE_RESPONSE,
			over_limit_months: overLimitMonths,
		} );

		renderCard();

		await expect( screen.findByText( warning ) ).resolves.toBeInTheDocument();
	} );

	it( 'does not warn a VIP site that reports periods over the limit', async () => {
		mockApiFetch.mockResolvedValue( { ...PLAN_USAGE_RESPONSE, over_limit_months: 2 } );
		window.JetpackScriptData = {
			site: { ...SITE, host: 'vip' },
		} as typeof window.JetpackScriptData;

		renderCard();

		await expect( screen.findByText( '6,200 / 10,000 views' ) ).resolves.toBeInTheDocument();
		expect( screen.queryByText( /surpassed your limit/ ) ).not.toBeInTheDocument();
	} );

	it.each( [
		[ 'no limit', null ],
		[ 'a zero limit', 0 ],
	] )( 'shows no meter when the plan reports %s', async ( _title, viewsLimit ) => {
		mockApiFetch.mockResolvedValue( { ...PLAN_USAGE_RESPONSE, views_limit: viewsLimit } );

		renderCard();

		await expect(
			screen.findByText( "Plan usage isn't available for your current plan." )
		).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'progressbar' ) ).not.toBeInTheDocument();
	} );

	it( 'offers Retry when the request fails', async () => {
		// A 403 skips the query client's retries, so the error shows without waiting out the backoff.
		mockApiFetch.mockRejectedValue( { status: 403 } );

		renderCard();

		await expect(
			screen.findByText( "We couldn't load plan usage. Please try again in a moment." )
		).resolves.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Retry' } ) ).toBeInTheDocument();
	} );
} );
