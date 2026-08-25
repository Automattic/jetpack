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
import { RouteHarness } from '../../route-harness';
import WordAdsChartTabsWidget from '../render';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

const mockApiFetch = apiFetch as unknown as jest.Mock;

const STATS_RESPONSE = {
	unit: 'day',
	fields: [ 'period', 'impressions', 'revenue', 'cpm' ],
	data: [ [ '2026-06-01', '1200', '6.50', '5.42' ] ],
};

/** The `path` of every `wordads/stats` proxy call made so far. */
function wordAdsRequestPaths(): string[] {
	return mockApiFetch.mock.calls
		.map( ( [ options ] ) => String( options?.path ?? '' ) )
		.filter( path => path.includes( 'wordads%2Fstats' ) || path.includes( 'wordads/stats' ) );
}

describe( 'WordAds chart date range control', () => {
	beforeEach( () => {
		// The data package's query client is a module-level singleton with a
		// nonzero staleTime; without clearing it a second render of the same
		// route search reuses the first test's cached data and never calls
		// `apiFetch` again, which would make the request-count assertions below
		// pass or fail for the wrong reason.
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

		// `last-7-days` resolves to a 7-bucket window; asserting the bucket count
		// (not just that some request happened) is what ties this to the URL's
		// preset rather than to whatever default the hook might fall back to.
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

		// Drive the real control, not the URL: this is what proves the picker and
		// the chart read one source. The quick-preset pills sit directly in the
		// toolbar (no trigger to open first) and apply immediately on click — see
		// `packages/ui/src/date-range-quick-presets/__tests__/date-range-quick-presets.test.tsx`
		// and `packages/ui/src/date-range-filter/__tests__/date-range-filter.test.tsx`,
		// which drive the same pills by their accessible names ('7 days', '30 days').
		await user.click( await screen.findByRole( 'button', { name: '30 days' } ) );

		// Not just "changed": the click was "30 days", so the refetched window
		// must carry that bucket count — a regression that changed to any other
		// window (e.g. a stale 7 or a wrong 90) would fail this.
		await waitFor( () =>
			expect( wordAdsRequestPaths().at( -1 ) ).toEqual( expect.stringContaining( 'quantity=30' ) )
		);
	} );

	it( 'issues one WordAds request, with no comparison request behind it', async () => {
		render(
			<RouteHarness search={ { preset: 'last-7-days', interval: 'day' } }>
				<WordAdsChartTabsWidget attributes={ {} } />
			</RouteHarness>
		);

		await waitFor( () => expect( wordAdsRequestPaths().length ).toBeGreaterThan( 0 ) );

		// `RouteHarness` declares `offersComparison={ false }`, the same thing a
		// `none` section declares, so `WidgetRoot` strips the comparison params.
		// Stripped params must mean no second request — not merely a request with
		// the comparison dates removed.
		await waitFor( () => expect( wordAdsRequestPaths() ).toHaveLength( 1 ) );
	} );
} );
