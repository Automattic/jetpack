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
jest.mock( '@wordpress/route', () => ( {
	Link: jest.requireActual( '../../../../tests/js/route-test-utils' ).mockWordPressRoute.Link,
} ) );

const mockApiFetch = apiFetch as unknown as jest.Mock;
const recordEvent = jest.mocked( analytics.tracks.recordEvent );

const UPGRADE_URL = 'https://wordpress.com/checkout/example.com/premium?redirect_to=back';

type Site = {
	offered?: boolean;
	upgradeUrl?: string;
	hasStatsProduct?: boolean;
	purchaseSuccess?: 'paid' | 'free';
	isWpcom?: boolean;
};

let notices = createNoticesRegistry();

/**
 * Seeds the script data the banner reads.
 *
 * @param site                 - The site to seed.
 * @param site.offered         - Whether the server offers the site a paid plan.
 * @param site.upgradeUrl      - Where the server sends the upgrade, empty when there is nowhere to buy it.
 * @param site.hasStatsProduct - Whether the site has a Jetpack Stats product.
 * @param site.purchaseSuccess - The checkout this load returned from, if any.
 * @param site.isWpcom         - Whether the site runs on WordPress.com.
 */
function setSite( {
	offered = true,
	upgradeUrl = UPGRADE_URL,
	hasStatsProduct = false,
	purchaseSuccess,
	isWpcom = false,
}: Site = {} ) {
	window.JetpackScriptData = {
		site: {
			admin_url: 'https://example.com/wp-admin/',
			host: 'jetpack',
			is_wpcom_platform: isWpcom,
			wpcom: { blog_id: 123456789 },
		},
		premium_analytics: {
			plan_gates: {
				tier: 'jetpack-free',
				locked_features: {},
				locked_widget_types: {},
				free_site_upgrade: offered
					? { upgrade_url: upgradeUrl, has_stats_product: hasStatsProduct }
					: null,
			},
			purchase_success: purchaseSuccess ? { type: purchaseSuccess } : undefined,
		},
	} as unknown as typeof window.JetpackScriptData;
}

/**
 * Answers the notices and plan usage requests.
 *
 * @param state     - The Stats notice visibility state, over a banner WordPress.com reports visible; a dismissal updates it.
 * @param viewsUsed - This cycle's views against a 10,000 limit.
 */
function mockEndpoints( state: Record< string, boolean | undefined > = {}, viewsUsed = 0 ) {
	let saved = { free_site_upgrade: true, ...state };
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
			<DashboardNotices onOpenSettings={ jest.fn() } />
		</RegistryProvider>
	);
	await act( () => jest.runAllTimersAsync() );
	await act( () => jest.runAllTimersAsync() );
	return view;
}

describe( 'FreeSiteUpgradeNotice', () => {
	beforeEach( () => {
		jest.useFakeTimers();
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
				'/upgrade?source=jetpack-premium-analytics-free-site-upgrade-notice'
			)
		);
	} );

	it( "sends a WordPress.com site to the server's purchase URL, since it upgrades its plan instead", async () => {
		setSite( { isWpcom: true } );
		mockEndpoints();

		await renderNotices();

		expect( screen.getByRole( 'link', { name: 'Upgrade' } ) ).toHaveAttribute(
			'href',
			UPGRADE_URL
		);
	} );

	it( 'keeps only Learn more when a WordPress.com site has nowhere to buy the plan', async () => {
		setSite( { upgradeUrl: '', isWpcom: true } );
		mockEndpoints();

		await renderNotices();

		expect( screen.queryByText( 'Upgrade' ) ).not.toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: /Learn more/ } ) ).toBeInTheDocument();
	} );

	it( 'asks a site on the free Stats product whether it wants more', async () => {
		setSite( { hasStatsProduct: true } );
		mockEndpoints();

		const { container } = await renderNotices();

		expect( container ).toHaveTextContent( 'Want to get the most out of Jetpack Stats?' );
	} );

	it( 'says nothing to a site the server does not offer a paid plan', async () => {
		setSite( { offered: false } );
		mockEndpoints();

		const { container } = await renderNotices();

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'stays away when the notices omit its state, as they do when WordPress.com fails', async () => {
		mockEndpoints( { free_site_upgrade: undefined } );

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

	it( 'stays in place after a failed dismissal, though the refetch fails too', async () => {
		mockEndpoints();
		const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
		const { container } = await renderNotices();
		mockApiFetch.mockRejectedValue( new Error( 'offline' ) );

		await user.click( screen.getByRole( 'button', { name: 'Dismiss' } ) );
		await act( () => jest.runAllTimersAsync() );

		expect( container ).toHaveTextContent( 'Unlock more Stats with a paid plan' );
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
