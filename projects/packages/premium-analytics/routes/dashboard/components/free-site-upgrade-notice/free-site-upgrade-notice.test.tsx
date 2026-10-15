/**
 * External dependencies
 */
import analytics from '@automattic/jetpack-analytics';
import { queryClient } from '@jetpack-premium-analytics/data';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { RegistryProvider } from '@wordpress/data';
/**
 * Internal dependencies
 */
import { createNoticesRegistry } from '../../../../tests/js/notice-test-utils';
import { DashboardNotices } from '../dashboard-notices';
import { resetPlanLimitNoticeForTesting } from '../plan-limit-notice/plan-limit-notice';
import { resetPurchaseSuccessNoticeForTesting } from '../purchase-success-notice/purchase-success-notice';
import { resetFreeSiteUpgradeNoticeForTesting } from './free-site-upgrade-notice';

jest.mock(
	'@automattic/jetpack-analytics',
	() => jest.requireActual( '../../../../tests/js/analytics-test-utils' ).mockJetpackAnalytics
);
jest.mock( '@wordpress/api-fetch', () => jest.fn() );

const mockApiFetch = apiFetch as unknown as jest.Mock;
const recordEvent = jest.mocked( analytics.tracks.recordEvent );

const NOW = new Date( '2026-10-15T00:00:00Z' ).getTime();
const DAY_SECONDS = 24 * 60 * 60;

type Site = {
	host?: string;
	tier?: string;
	daysSinceFirstVisit?: number;
	hasStatsProduct?: boolean;
	purchaseSuccess?: 'paid' | 'free';
};

let notices = createNoticesRegistry();

/**
 * Seeds the script data the banner reads.
 *
 * @param site                     - The site to seed.
 * @param site.host                - The site's host.
 * @param site.tier                - The Stats plan tier.
 * @param site.daysSinceFirstVisit - Days since the site first opened the dashboard.
 * @param site.hasStatsProduct     - Whether the site has a Jetpack Stats product.
 * @param site.purchaseSuccess     - The checkout this load returned from, if any.
 */
function setSite( {
	host = 'jetpack',
	tier = 'jetpack-free',
	daysSinceFirstVisit = 30,
	hasStatsProduct = false,
	purchaseSuccess,
}: Site = {} ) {
	window.JetpackScriptData = {
		site: {
			admin_url: 'https://example.com/wp-admin/',
			host,
			wpcom: { blog_id: 123456789 },
		},
		premium_analytics: {
			first_visit: NOW / 1000 - daysSinceFirstVisit * DAY_SECONDS,
			plan_gates: {
				tier,
				locked_features: {},
				locked_widget_types: {},
				has_stats_product: hasStatsProduct,
			},
			purchase_success: purchaseSuccess ? { type: purchaseSuccess } : undefined,
		},
	} as unknown as typeof window.JetpackScriptData;
}

/**
 * Answers the notices and plan usage requests.
 *
 * @param state     - The Stats notice visibility state; a dismissal updates it.
 * @param viewsUsed - This cycle's views against a 10,000 limit.
 */
function mockEndpoints( state: Record< string, boolean > = {}, viewsUsed = 0 ) {
	let saved = state;
	mockApiFetch.mockImplementation( ( { path, method }: { path: string; method?: string } ) => {
		if ( path.includes( 'jetpack-stats/usage' ) ) {
			return Promise.resolve( {
				current_usage: { views_count: viewsUsed },
				views_limit: 10000,
			} );
		}
		if ( path.includes( 'notices' ) ) {
			if ( method === 'POST' ) {
				saved = { ...saved, free_site_upgrade: false };
			}
			return Promise.resolve( saved );
		}
		return Promise.reject( new Error( `Unexpected request: ${ path }` ) );
	} );
}

/**
 * Renders the notices and settles their requests.
 *
 * @return The render result.
 */
async function renderNotices() {
	const view = render(
		<RegistryProvider value={ notices.registry }>
			<DashboardNotices />
		</RegistryProvider>
	);
	await act( () => jest.runAllTimersAsync() );
	await act( () => jest.runAllTimersAsync() );
	return view;
}

describe( 'FreeSiteUpgradeNotice', () => {
	beforeEach( () => {
		jest.useFakeTimers( { now: NOW } );
		queryClient.clear();
		resetFreeSiteUpgradeNoticeForTesting();
		resetPlanLimitNoticeForTesting();
		resetPurchaseSuccessNoticeForTesting();
		notices = createNoticesRegistry();
		recordEvent.mockClear();
		mockApiFetch.mockReset();
		setSite();
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	it( 'offers the upgrade to a free site 30 days after its first visit', async () => {
		mockEndpoints();

		const { container } = await renderNotices();

		expect( container ).toHaveTextContent( 'Unlock more Stats with a paid plan' );
		expect( screen.getByRole( 'link', { name: 'Upgrade' } ) ).toHaveAttribute(
			'href',
			expect.stringContaining(
				'admin.php?page=stats#!/stats/purchase/123456789?from=jetpack-premium-analytics-free-site-upgrade-notice'
			)
		);
	} );

	it( 'asks a site on the free Stats product whether it wants more', async () => {
		setSite( { hasStatsProduct: true } );
		mockEndpoints();

		const { container } = await renderNotices();

		expect( container ).toHaveTextContent( 'Want to get the most out of Jetpack Stats?' );
	} );

	it.each( [
		[ 'a site with paid Stats', { tier: 'commercial' } ],
		[ 'a site whose plan has not synced', { tier: 'unknown' } ],
		[ 'a site in its first 30 days', { daysSinceFirstVisit: 29 } ],
		[ 'a VIP site', { host: 'vip' } ],
		[ 'a WordPress.com Simple site', { host: 'wpcom' } ],
	] )( 'says nothing to %s', async ( _label, site: Site ) => {
		setSite( site );
		mockEndpoints();

		const { container } = await renderNotices();

		expect( container ).toBeEmptyDOMElement();
	} );

	it.each( [ 'free_site_upgrade', 'do_you_love_jetpack_stats', 'commercial_site_upgrade' ] )(
		'stays away once Stats has %s dismissed',
		async id => {
			mockEndpoints( { [ id ]: false } );

			const { container } = await renderNotices();

			expect( container ).toBeEmptyDOMElement();
		}
	);

	it( 'postpones the banner for ten years when dismissed', async () => {
		mockEndpoints();
		const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
		const { container } = await renderNotices();

		await user.click( screen.getByRole( 'button', { name: 'Dismiss' } ) );
		await act( () => jest.runAllTimersAsync() );

		expect( container ).toBeEmptyDOMElement();
		expect( mockApiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( {
				method: 'POST',
				data: { id: 'free_site_upgrade', status: 'postponed', postponed_for: 315360000 },
			} )
		);
	} );

	it( 'shows instead of the plan limit notice when both apply', async () => {
		mockEndpoints( {}, 9500 );

		const { container } = await renderNotices();

		expect( container ).toHaveTextContent( 'Unlock more Stats with a paid plan' );
		expect( container ).not.toHaveTextContent( 'You are nearing your monthly limit' );
	} );

	it( 'gives way to the thank-you notice when a checkout returns', async () => {
		setSite( { purchaseSuccess: 'free' } );
		mockEndpoints( {}, 9500 );

		const { container } = await renderNotices();

		expect( container ).toHaveTextContent( 'Thank you for using Jetpack Stats!' );
		expect( container ).not.toHaveTextContent( 'Unlock more Stats with a paid plan' );
		expect( container ).not.toHaveTextContent( 'You are nearing your monthly limit' );
	} );

	it( 'leaves the plan limit notice in place once dismissed', async () => {
		mockEndpoints( { free_site_upgrade: false }, 9500 );

		const { container } = await renderNotices();

		expect( container ).toHaveTextContent( 'You are nearing your monthly limit' );
	} );

	it( 'records one view per page load, though every section tab mounts the notices', async () => {
		mockEndpoints();

		const { unmount } = await renderNotices();
		unmount();
		await renderNotices();

		const views = recordEvent.mock.calls.filter(
			( [ name ] ) => name === 'jetpack_premium_analytics_free_site_upgrade_notice_view'
		);
		expect( views ).toHaveLength( 1 );
	} );
} );
