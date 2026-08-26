/**
 * External dependencies
 */
import { queryClient } from '@jetpack-premium-analytics/data';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import { RouteHarness } from '../route-harness';
import WordAdsChartTabsWidget from '../render';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

const mockApiFetch = apiFetch as unknown as jest.Mock;

const STATS_RESPONSE = {
	unit: 'day',
	fields: [ 'period', 'impressions', 'revenue', 'cpm' ],
	data: [ [ '2026-06-01', '1200', '6.50', '5.42' ] ],
};

function wordAdsRequestPaths(): string[] {
	return mockApiFetch.mock.calls
		.map( ( [ options ] ) => String( options?.path ?? '' ) )
		.filter( path => path.includes( 'wordads%2Fstats' ) || path.includes( 'wordads/stats' ) );
}

describe( 'WordAds chart date range control', () => {
	beforeEach( () => {
		// Clear the singleton query cache so request assertions never reuse stale data.
		queryClient.clear();
		mockApiFetch.mockReset();
		mockApiFetch.mockResolvedValue( STATS_RESPONSE );
	} );

	it( 'requests the range the URL carries, with no injected attributes', async () => {
		render(
			<RouteHarness search={ { preset: 'last-7-days', interval: 'day' } }>
				<WordAdsChartTabsWidget attributes={ {} } />
			</RouteHarness>
		);

		await waitFor( () =>
			expect( wordAdsRequestPaths().at( -1 ) ).toEqual( expect.stringContaining( 'quantity=7' ) )
		);
	} );

	it( 'refetches with a different window when the picker commits a new range', async () => {
		const user = userEvent.setup();

		render(
			<RouteHarness search={ { preset: 'last-7-days', interval: 'day' } }>
				<WordAdsChartTabsWidget attributes={ {} } />
			</RouteHarness>
		);

		await waitFor( () =>
			expect( wordAdsRequestPaths().at( -1 ) ).toEqual( expect.stringContaining( 'quantity=7' ) )
		);

		// Drive the control to prove it and the chart share URL state.
		await user.click( await screen.findByRole( 'button', { name: '30 days' } ) );

		await waitFor( () =>
			expect( wordAdsRequestPaths().at( -1 ) ).toEqual( expect.stringContaining( 'quantity=30' ) )
		);
	} );

	it( 'buckets by the interval the URL carries', async () => {
		render(
			<RouteHarness search={ { preset: 'last-90-days', interval: 'week' } }>
				<WordAdsChartTabsWidget attributes={ {} } />
			</RouteHarness>
		);

		await waitFor( () =>
			expect( wordAdsRequestPaths().at( -1 ) ).toEqual( expect.stringContaining( 'unit=week' ) )
		);
	} );

	it( 'clamps an unsupported URL interval to the closest supported bucket', async () => {
		render(
			<RouteHarness search={ { preset: 'last-365-days', interval: 'quarter' } }>
				<WordAdsChartTabsWidget attributes={ {} } />
			</RouteHarness>
		);

		await waitFor( () =>
			expect( wordAdsRequestPaths().at( -1 ) ).toEqual( expect.stringContaining( 'unit=month' ) )
		);
	} );

	// The harness enables comparison, so only the widget can suppress its second request.
	it( 'issues one WordAds request even when the host offers comparison', async () => {
		render(
			<RouteHarness search={ { preset: 'last-7-days', interval: 'day' } }>
				<WordAdsChartTabsWidget attributes={ {} } />
			</RouteHarness>
		);

		await waitFor( () => expect( wordAdsRequestPaths().length ).toBeGreaterThan( 0 ) );

		await waitFor( () => expect( wordAdsRequestPaths() ).toHaveLength( 1 ) );
	} );
} );
