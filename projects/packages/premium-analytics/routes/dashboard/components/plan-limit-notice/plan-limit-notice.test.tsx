/**
 * External dependencies
 */
import { queryClient } from '@jetpack-premium-analytics/data';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import { PlanLimitNotice } from './plan-limit-notice';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

const mockApiFetch = apiFetch as unknown as jest.Mock;

type Usage = { views_count: number; views_limit: number | null };
type Notices = { tier_upgrade?: boolean };

/**
 * Answers the usage and notices requests the notice makes.
 *
 * @param usage   - This cycle's views and the plan's limit.
 * @param notices - The Stats notice visibility state.
 */
function mockEndpoints( usage: Usage, notices: Notices = {} ) {
	mockApiFetch.mockImplementation( ( { path, method }: { path: string; method?: string } ) => {
		if ( path.includes( 'jetpack-stats/usage' ) ) {
			return Promise.resolve( {
				current_usage: { views_count: usage.views_count },
				views_limit: usage.views_limit,
			} );
		}
		if ( path.includes( 'notices' ) ) {
			return Promise.resolve( method === 'POST' ? { tier_upgrade: false } : notices );
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
	const view = render( <PlanLimitNotice enabled /> );
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
		mockApiFetch.mockReset();
		setHost( 'jetpack' );
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	it( 'warns a site at 90% of its limit and links to the upgrade', async () => {
		mockEndpoints( { views_count: 9120, views_limit: 10000 } );

		const { container } = await renderNotice();

		expect( container ).toHaveTextContent( 'You are approaching your plan’s view limit' );
		expect( container ).toHaveTextContent( '9,120 of 10,000 billable views used this cycle.' );
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

	it( 'cannot be dismissed once the site is over its limit', async () => {
		mockEndpoints( { views_count: 11480, views_limit: 10000 }, { tier_upgrade: false } );

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
	} );

	it.each( [ 'wpcom', 'vip' ] )( 'says nothing on a %s site', async host => {
		setHost( host );
		mockEndpoints( { views_count: 11480, views_limit: 10000 } );

		const { container } = await renderNotice();

		expect( container ).toBeEmptyDOMElement();
	} );
} );
