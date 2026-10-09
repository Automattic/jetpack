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
import { PlanLimitNotice, resetPlanLimitNoticeForTesting } from './plan-limit-notice';

jest.mock(
	'@automattic/jetpack-analytics',
	() => jest.requireActual( '../../../../tests/js/analytics-test-utils' ).mockJetpackAnalytics
);
jest.mock( '@wordpress/api-fetch', () => jest.fn() );

const mockApiFetch = apiFetch as unknown as jest.Mock;
const recordEvent = jest.mocked( analytics.tracks.recordEvent );

type Usage = { views_count: number; views_limit: number | null };
type Notices = { tier_upgrade?: boolean };

let notices = createNoticesRegistry();

/**
 * Answers the usage and notices requests the notice makes.
 *
 * @param usage     - This cycle's views and the plan's limit.
 * @param state     - The Stats notice visibility state.
 * @param saveReply - The reply to saving a notice's visibility.
 */
function mockEndpoints(
	usage: Usage,
	state: Notices = {},
	saveReply: () => Promise< unknown > = () => Promise.resolve( { tier_upgrade: false } )
) {
	mockApiFetch.mockImplementation( ( { path, method }: { path: string; method?: string } ) => {
		if ( path.includes( 'jetpack-stats/usage' ) ) {
			return Promise.resolve( {
				current_usage: { views_count: usage.views_count },
				views_limit: usage.views_limit,
			} );
		}
		if ( path.includes( 'notices' ) ) {
			return method === 'POST' ? saveReply() : Promise.resolve( state );
		}
		return Promise.reject( new Error( `Unexpected request: ${ path }` ) );
	} );
}

/**
 * Seeds the script data the notice reads the host and purchase URL from.
 *
 * @param host - The site's host, as script data reports it.
 */
function setHost( host: string ) {
	window.JetpackScriptData = {
		site: {
			admin_url: 'https://example.com/wp-admin/',
			host,
			wpcom: { blog_id: 123456789 },
		},
	} as typeof window.JetpackScriptData;
}

/**
 * Renders the notice and settles its requests.
 *
 * @return The render result.
 */
async function renderNotice() {
	const view = render(
		<RegistryProvider value={ notices.registry }>
			<PlanLimitNotice enabled />
		</RegistryProvider>
	);
	// The notices request waits on the usage reply, so settle both rounds.
	await act( () => jest.runAllTimersAsync() );
	await act( () => jest.runAllTimersAsync() );
	return view;
}

/*
 * The notice speaks its message through `@wordpress/a11y`, which mirrors the
 * text into a live region on `document.body`. Assertions read the rendered
 * container so they don't match that copy too.
 */
describe( 'PlanLimitNotice', () => {
	beforeEach( () => {
		jest.useFakeTimers();
		queryClient.clear();
		resetPlanLimitNoticeForTesting();
		notices = createNoticesRegistry();
		recordEvent.mockClear();
		mockApiFetch.mockReset();
		setHost( 'jetpack' );
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	it( 'warns a site at 90% of its limit and offers the upgrade', async () => {
		mockEndpoints( { views_count: 9000, views_limit: 10000 } );

		const { container } = await renderNotice();

		expect( container ).toHaveTextContent( 'You are approaching your plan’s view limit' );
		expect( container ).toHaveTextContent( '9,000 of 10,000 billable views used this cycle.' );
		expect( screen.getByRole( 'link', { name: 'Upgrade plan' } ) ).toHaveAttribute(
			'href',
			expect.stringContaining(
				'admin.php?page=stats#!/stats/purchase/123456789?from=jetpack-premium-analytics-plan-limit-notice'
			)
		);
	} );

	it( 'says nothing below 90% of the limit', async () => {
		mockEndpoints( { views_count: 8999, views_limit: 10000 } );

		const { container } = await renderNotice();

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'says nothing to a site without a views limit', async () => {
		mockEndpoints( { views_count: 50000, views_limit: null } );

		const { container } = await renderNotice();

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'cannot be dismissed once the site reaches its limit', async () => {
		mockEndpoints( { views_count: 10000, views_limit: 10000 }, { tier_upgrade: false } );

		const { container } = await renderNotice();

		expect( container ).toHaveTextContent( 'You have gone over your plan’s view limit' );
		expect( screen.queryByRole( 'button', { name: 'Dismiss' } ) ).not.toBeInTheDocument();
	} );

	it( 'stays away near the limit while Stats has it postponed', async () => {
		mockEndpoints( { views_count: 9120, views_limit: 10000 }, { tier_upgrade: false } );

		const { container } = await renderNotice();

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'postpones the near-limit notice for a week when dismissed', async () => {
		mockEndpoints( { views_count: 9120, views_limit: 10000 } );
		const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
		const { container } = await renderNotice();

		await user.click( screen.getByRole( 'button', { name: 'Dismiss' } ) );

		expect( container ).toBeEmptyDOMElement();
		expect( mockApiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( {
				method: 'POST',
				data: { id: 'tier_upgrade', status: 'postponed', postponed_for: 604800 },
			} )
		);
		expect( recordEvent ).toHaveBeenCalledWith(
			'jetpack_premium_analytics_plan_limit_notice_dismiss',
			undefined
		);
	} );

	it( 'stays dismissed in a section that mounts before the dismissal is saved', async () => {
		let saveDismissal = () => {};
		mockEndpoints(
			{ views_count: 9120, views_limit: 10000 },
			{},
			() => new Promise( resolve => ( saveDismissal = () => resolve( { tier_upgrade: false } ) ) )
		);
		const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
		const { unmount } = await renderNotice();
		await user.click( screen.getByRole( 'button', { name: 'Dismiss' } ) );
		unmount();
		const view = render(
			<RegistryProvider value={ notices.registry }>
				<PlanLimitNotice enabled />
			</RegistryProvider>
		);

		expect( view.container ).toBeEmptyDOMElement();
		saveDismissal();
	} );

	it( 'brings the notice back and says so when the dismissal fails', async () => {
		mockEndpoints( { views_count: 9120, views_limit: 10000 }, {}, () =>
			Promise.reject( new Error( 'offline' ) )
		);
		const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
		const { container } = await renderNotice();
		// Offline: the refetch after the failure never answers either.
		mockApiFetch.mockImplementation( ( { method }: { method?: string } ) =>
			method === 'POST' ? Promise.reject( new Error( 'offline' ) ) : new Promise( () => {} )
		);

		await user.click( screen.getByRole( 'button', { name: 'Dismiss' } ) );
		await act( () => jest.runAllTimersAsync() );

		expect( container ).toHaveTextContent( 'You are approaching your plan’s view limit' );
		expect( notices.createErrorNotice ).toHaveBeenCalledWith(
			'Couldn’t dismiss the notice. Please try again.',
			{ type: 'snackbar' }
		);
	} );

	it( 'records one view per page load, though every section tab mounts the notice', async () => {
		mockEndpoints( { views_count: 11480, views_limit: 10000 } );

		const { unmount } = await renderNotice();
		unmount();
		await renderNotice();

		const views = recordEvent.mock.calls.filter(
			( [ name ] ) => name === 'jetpack_premium_analytics_plan_limit_notice_view'
		);
		expect( views ).toEqual( [
			[ 'jetpack_premium_analytics_plan_limit_notice_view', { status: 'over' } ],
		] );
	} );

	it.each( [
		[ 'near', 9120 ],
		[ 'over', 11480 ],
	] )( 'records an upgrade click from the %s notice', async ( status, views_count ) => {
		mockEndpoints( { views_count, views_limit: 10000 } );
		const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
		await renderNotice();
		// jsdom cannot follow the link to another page.
		const stopNavigation = ( event: Event ) => event.preventDefault();
		document.addEventListener( 'click', stopNavigation );

		await user.click( screen.getByRole( 'link', { name: 'Upgrade plan' } ) );

		document.removeEventListener( 'click', stopNavigation );
		expect( recordEvent ).toHaveBeenCalledWith(
			'jetpack_premium_analytics_plan_limit_notice_upgrade_click',
			{ status }
		);
	} );

	it.each( [ 'wpcom', 'vip' ] )( 'says nothing on a %s site', async host => {
		setHost( host );
		mockEndpoints( { views_count: 11480, views_limit: 10000 } );

		const { container } = await renderNotice();

		expect( container ).toBeEmptyDOMElement();
	} );
} );
