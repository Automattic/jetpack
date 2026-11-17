/**
 * External dependencies
 */
import analytics from '@automattic/jetpack-analytics';
import {
	queryClient,
	takeConsentCardFocusRequest,
	updateConsentStatus,
} from '@jetpack-premium-analytics/data';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { RegistryProvider } from '@wordpress/data';
/**
 * Internal dependencies
 */
import { resetConsentStatusForTesting } from '../../../../packages/data/src/hooks/use-consent-status';
import { createNoticesRegistry } from '../../../../tests/js/notice-test-utils';
import { DashboardNotices } from '../dashboard-notices';
import { resetFreeSiteUpgradeNoticeForTesting } from '../free-site-upgrade-notice/free-site-upgrade-notice';
import { resetPlanLimitNoticeForTesting } from '../plan-limit-notice/plan-limit-notice';
import { resetVisitorConsentNoticeForTesting } from './visitor-consent-notice';

jest.mock(
	'@automattic/jetpack-analytics',
	() => jest.requireActual( '../../../../tests/js/analytics-test-utils' ).mockJetpackAnalytics
);
jest.mock( '@wordpress/api-fetch', () => jest.fn() );
const mockNavigate = jest.fn();
jest.mock( '@wordpress/route', () => ( {
	...jest.requireActual( '../../../../tests/js/route-test-utils' ).mockWordPressRoute,
	useNavigate: () => mockNavigate,
} ) );

const mockApiFetch = apiFetch as unknown as jest.Mock;
const recordEvent = jest.mocked( analytics.tracks.recordEvent );

const NOT_SET_UP = {
	api_active: false,
	api_installed: true,
	consent_type_declared: false,
	banner_plugin: 'Complianz',
	banner_blocks_stats: false,
	recommended_banners: [],
	can_install: true,
	can_activate: true,
	file_mods_allowed: true,
};

let notices = createNoticesRegistry();

/**
 * Seeds the script data the notice reads.
 *
 * @param consent        - Changes to a site whose Complianz banner Stats cannot hear yet.
 * @param upgradeOffered - Whether the server also offers the site a paid plan.
 */
function setSite( consent: Partial< typeof NOT_SET_UP > = {}, upgradeOffered = false ) {
	window.JetpackScriptData = {
		site: { admin_url: 'https://example.com/wp-admin/', host: 'jetpack' },
		premium_analytics: {
			stats_settings: {
				roles: [],
				features_url: null,
				consent: { ...NOT_SET_UP, ...consent },
			},
			plan_gates: upgradeOffered
				? {
						tier: 'jetpack-free',
						locked_features: {},
						locked_widget_types: {},
						free_site_upgrade: { upgrade_url: '', has_stats_product: false },
					}
				: undefined,
		},
	} as unknown as typeof window.JetpackScriptData;
}

/**
 * Answers the notices and plan usage requests.
 *
 * @param state - The Stats notice visibility state, over a notice WordPress.com reports visible.
 */
function mockEndpoints( state: Record< string, boolean | undefined > = {} ) {
	let saved = { visitor_consent_setup: true, free_site_upgrade: true, ...state };
	mockApiFetch.mockImplementation(
		( { path, method, data }: { path: string; method?: string; data?: { id: string } } ) => {
			if ( path.includes( 'jetpack-stats/usage' ) ) {
				return Promise.resolve( { current_usage: { views_count: 0 }, views_limit: 10000 } );
			}
			if ( path.includes( 'notices' ) ) {
				if ( method === 'POST' && data ) {
					saved = { ...saved, [ data.id ]: false };
				}
				return Promise.resolve( saved );
			}
			return Promise.reject( new Error( `Unexpected request: ${ path }` ) );
		}
	);
}

/**
 * Renders the dashboard notices and settles their requests.
 *
 * @return The render result.
 */
async function renderNotices() {
	const view = render(
		<RegistryProvider value={ notices.registry }>
			<div data-testid="notices">
				<DashboardNotices />
			</div>
		</RegistryProvider>
	);
	await act( () => jest.runAllTimersAsync() );
	await act( () => jest.runAllTimersAsync() );
	return view;
}

describe( 'VisitorConsentNotice', () => {
	let user: ReturnType< typeof userEvent.setup >;

	beforeEach( () => {
		jest.useFakeTimers();
		queryClient.clear();
		resetVisitorConsentNoticeForTesting();
		resetFreeSiteUpgradeNoticeForTesting();
		resetPlanLimitNoticeForTesting();
		resetConsentStatusForTesting();
		notices = createNoticesRegistry();
		recordEvent.mockClear();
		mockNavigate.mockClear();
		mockApiFetch.mockReset();
		user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
	} );

	afterEach( () => {
		jest.useRealTimers();
		delete window.JetpackScriptData;
	} );

	it.each( [
		[ 'by name', {}, 'follow what visitors choose in Complianz.' ],
		[
			'when its plugin is not one Stats knows',
			{ banner_plugin: null, consent_type_declared: true },
			'follow what visitors choose in your cookie banner.',
		],
	] )( 'invites the site to connect its cookie banner, %s', async ( _title, consent, text ) => {
		setSite( consent );
		mockEndpoints();

		await renderNotices();

		expect( screen.getByText( 'Connect your cookie banner to Stats' ) ).toBeInTheDocument();
		expect( screen.getByText( text, { exact: false } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: /Learn more/ } ) ).toHaveAttribute(
			'href',
			'https://jetpack.com/support/jetpack-stats/'
		);
		expect( recordEvent ).toHaveBeenCalledWith(
			'jetpack_premium_analytics_visitor_consent_notice_view',
			undefined
		);
	} );

	it.each( [
		[ 'WP Consent API is already active', { api_active: true }, {} ],
		[ 'the site has no cookie banner', { banner_plugin: null }, {} ],
		[ 'the banner already blocks Stats itself', { banner_blocks_stats: true }, {} ],
		[ 'WordPress.com omits its state', {}, { visitor_consent_setup: undefined } ],
		[ 'the user dismissed it', {}, { visitor_consent_setup: false } ],
	] )( 'stays away when %s', async ( _title, consent, state ) => {
		setSite( consent );
		mockEndpoints( state );

		await renderNotices();

		expect( screen.getByTestId( 'notices' ) ).toBeEmptyDOMElement();
	} );

	it( 'shows instead of the paid plan offer when both apply', async () => {
		setSite( {}, true );
		mockEndpoints();

		await renderNotices();

		expect( screen.getByText( 'Connect your cookie banner to Stats' ) ).toBeInTheDocument();
		expect( screen.queryByText( /paid plan/ ) ).not.toBeInTheDocument();
	} );

	it( 'opens Settings, asking the Visitor consent card to take focus', async () => {
		setSite();
		mockEndpoints();
		await renderNotices();

		await user.click( screen.getByRole( 'button', { name: 'Set up' } ) );

		expect( mockNavigate ).toHaveBeenCalledWith( expect.objectContaining( { to: '/settings' } ) );
		expect( recordEvent ).toHaveBeenCalledWith(
			'jetpack_premium_analytics_visitor_consent_notice_set_up_click',
			undefined
		);
		expect( takeConsentCardFocusRequest() ).toBe( true );
	} );

	it( 'goes for good once dismissed', async () => {
		setSite();
		mockEndpoints();
		await renderNotices();

		await user.click( screen.getByRole( 'button', { name: 'Dismiss' } ) );
		await act( () => jest.runAllTimersAsync() );

		expect( screen.getByTestId( 'notices' ) ).toBeEmptyDOMElement();
		expect( mockApiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( {
				method: 'POST',
				data: { id: 'visitor_consent_setup', status: 'dismissed' },
			} )
		);
	} );

	it( 'goes once Settings sets up WP Consent API', async () => {
		setSite();
		mockEndpoints();
		await renderNotices();

		act( () => updateConsentStatus( { api_active: true } ) );
		await act( () => jest.runAllTimersAsync() );

		expect( screen.getByTestId( 'notices' ) ).toBeEmptyDOMElement();
	} );
} );
