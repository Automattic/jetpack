/**
 * External dependencies
 */
import { queryClient } from '@jetpack-premium-analytics/data';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import useWordAdsChart from '../use-wordads-chart';
import type { ReportParams } from '@jetpack-premium-analytics/data';
import type { ReactNode } from 'react';

jest.mock( '@wordpress/api-fetch' );

const mockApiFetch = apiFetch as jest.MockedFunction< typeof apiFetch >;

// Raw WPCOM `wordads/stats` matrix shape: two monthly buckets, so the summary
// totals impressions (2000) and revenue (9.75), and CPM is the weighted average
// revenue / impressions * 1000 = 4.875.
const PRIMARY_RESPONSE = {
	unit: 'month',
	fields: [ 'period', 'impressions', 'revenue', 'cpm' ],
	data: [
		[ '2026-05', '1200', '6.50', '5.42' ],
		[ '2026-06', 800, 3.25, 4.06 ],
	],
};

// Lower comparison period so the previous-period value is distinct.
const COMPARISON_RESPONSE = {
	unit: 'month',
	fields: [ 'period', 'impressions', 'revenue', 'cpm' ],
	data: [ [ '2026-03', '500', '2.00', '4.00' ] ],
};

function wrapper( { children }: { children: ReactNode } ) {
	return <QueryClientProvider client={ queryClient }>{ children }</QueryClientProvider>;
}

describe( 'useWordAdsChart', () => {
	beforeEach( () => {
		// The data package's query client is a module-level singleton; drop its
		// cache so each test starts from a fresh fetch.
		queryClient.clear();
		mockApiFetch.mockReset();
		mockApiFetch.mockResolvedValue( PRIMARY_RESPONSE );
	} );

	it( 'builds Ads Served, Average CPM, and Revenue tabs from the summary totals', async () => {
		const reportParams: ReportParams = {
			from: '2026-05-01',
			to: '2026-06-30',
			interval: 'month',
		};

		const { result } = renderHook( () => useWordAdsChart( reportParams, 'month' ), { wrapper } );

		await waitFor( () => expect( result.current.isFetching ).toBe( false ) );

		// Upstream tab labels and order (the Calypso WordAds page's CHARTS array).
		const metrics = result.current.metrics;
		expect( metrics.map( metric => metric.key ) ).toEqual( [ 'impressions', 'cpm', 'revenue' ] );
		expect( metrics.map( metric => metric.label ) ).toEqual( [
			'Ads Served',
			'Average CPM',
			'Revenue',
		] );
		expect( metrics[ 0 ].value ).toBe( 2000 );
		expect( metrics[ 1 ].value ).toBeCloseTo( 4.875 );
		expect( metrics[ 2 ].value ).toBeCloseTo( 9.75 );
		// Currency format only on CPM/revenue; impressions falls back to the chart default.
		expect( metrics[ 0 ].dataFormat ).toBeUndefined();
		expect( metrics[ 1 ].dataFormat?.type ).toBe( 'currency' );
		expect( metrics[ 2 ].dataFormat?.type ).toBe( 'currency' );
		// One chart point per period; no comparison overlay without comparison params.
		expect( metrics[ 0 ].current ).toHaveLength( 2 );
		expect( metrics[ 0 ].previous ).toBeUndefined();
		expect( metrics[ 0 ].previousValue ).toBeUndefined();
		expect( result.current.isEmpty ).toBe( false );
	} );

	it( 'shows only the selected metrics, in canonical order', async () => {
		const reportParams: ReportParams = {
			from: '2026-05-01',
			to: '2026-06-30',
			interval: 'month',
		};

		// Pass the ids out of canonical order to prove the tab order is resolved
		// against the definitions, not the selection order.
		const { result } = renderHook(
			() => useWordAdsChart( reportParams, 'month', [ 'revenue', 'impressions' ] ),
			{ wrapper }
		);

		await waitFor( () => expect( result.current.isFetching ).toBe( false ) );

		expect( result.current.metrics.map( metric => metric.key ) ).toEqual( [
			'impressions',
			'revenue',
		] );
	} );

	it( 'yields no metric tabs when the selection is empty', async () => {
		const reportParams: ReportParams = {
			from: '2026-05-01',
			to: '2026-06-30',
			interval: 'month',
		};

		const { result } = renderHook( () => useWordAdsChart( reportParams, 'month', [] ), {
			wrapper,
		} );

		expect( result.current.metrics ).toHaveLength( 0 );
	} );

	it( 'requests the wordads/stats endpoint honouring the range and granularity', async () => {
		const reportParams: ReportParams = {
			from: '2026-05-01',
			to: '2026-06-30',
			interval: 'month',
		};

		const { result } = renderHook( () => useWordAdsChart( reportParams, 'month' ), { wrapper } );

		await waitFor( () => expect( result.current.isFetching ).toBe( false ) );

		const requestedPath = mockApiFetch.mock.calls[ 0 ][ 0 ].path as string;
		expect( requestedPath ).toContain( 'wordads/stats' );
		expect( requestedPath ).toContain( 'unit=month' );
		expect( requestedPath ).toContain( 'date=2026-06-30' );
		// The bucket count spans the range — not the legacy fixed 30.
		expect( requestedPath ).toContain( 'quantity=2' );
	} );

	it( 'reports the empty state when the period resolves without rows', async () => {
		mockApiFetch.mockResolvedValue( {
			unit: 'month',
			fields: [ 'period', 'impressions', 'revenue', 'cpm' ],
			data: [],
		} );

		const reportParams: ReportParams = {
			from: '2026-05-01',
			to: '2026-06-30',
			interval: 'month',
		};

		const { result } = renderHook( () => useWordAdsChart( reportParams, 'month' ), { wrapper } );

		// Loading (no data yet) is not empty; resolved-with-no-rows is.
		expect( result.current.isLoading ).toBe( true );
		expect( result.current.isEmpty ).toBe( false );

		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );

		expect( result.current.isEmpty ).toBe( true );
		expect( result.current.metrics[ 0 ].current ).toHaveLength( 0 );
	} );

	it( 'maps previous-period totals when comparison params are present', async () => {
		mockApiFetch.mockImplementation( ( { path = '' }: { path?: string } ) =>
			Promise.resolve( path.includes( 'date=2026-03-31' ) ? COMPARISON_RESPONSE : PRIMARY_RESPONSE )
		);

		const reportParams: ReportParams = {
			from: '2026-05-01',
			to: '2026-06-30',
			interval: 'month',
			comp: '1',
			compare_from: '2026-03-01',
			compare_to: '2026-03-31',
		};

		const { result } = renderHook( () => useWordAdsChart( reportParams, 'month' ), { wrapper } );

		await waitFor( () => expect( result.current.metrics[ 0 ].previousValue ).toBe( 500 ) );

		const metrics = result.current.metrics;
		expect( metrics[ 0 ].previous ).toHaveLength( 1 );
		expect( metrics[ 1 ].previousValue ).toBeCloseTo( 4 );
		expect( metrics[ 2 ].previousValue ).toBeCloseTo( 2 );

		const requestedPaths = mockApiFetch.mock.calls.map(
			( [ { path } ]: [ { path: string } ] ) => path
		);
		expect( requestedPaths.some( p => p.includes( 'date=2026-06-30' ) ) ).toBe( true );
		expect( requestedPaths.some( p => p.includes( 'date=2026-03-31' ) ) ).toBe( true );
	} );

	it( 'aligns a longer comparison window to the primary bucket count', async () => {
		// The primary window is clamped to end yesterday (WordAds is computed
		// nightly), so a range ending today loses its trailing bucket. The
		// comparison window sits in the past and keeps every bucket, so it comes
		// back one bucket longer. Here: primary has 2 buckets, comparison 3. The
		// hook must trim the comparison to the primary's 2 (dropping the trailing
		// bucket) so the delta compares equal-length windows and the overlay
		// aligns point-for-point.
		const LONGER_COMPARISON_RESPONSE = {
			unit: 'month',
			fields: [ 'period', 'impressions', 'revenue', 'cpm' ],
			data: [
				[ '2026-01', 300, 1.5, 5.0 ],
				[ '2026-02', 400, 2.0, 5.0 ],
				// Trailing bucket that has no counterpart in the clamped primary.
				[ '2026-03', 500, 3.0, 6.0 ],
			],
		};
		mockApiFetch.mockImplementation( ( { path = '' }: { path?: string } ) =>
			Promise.resolve(
				path.includes( 'date=2026-03-31' ) ? LONGER_COMPARISON_RESPONSE : PRIMARY_RESPONSE
			)
		);

		const reportParams: ReportParams = {
			from: '2026-05-01',
			to: '2026-06-30',
			interval: 'month',
			comp: '1',
			compare_from: '2026-01-01',
			compare_to: '2026-03-31',
		};

		const { result } = renderHook( () => useWordAdsChart( reportParams, 'month' ), { wrapper } );

		await waitFor( () => expect( result.current.metrics[ 0 ].previous ).toHaveLength( 2 ) );

		const metrics = result.current.metrics;
		// Current stays at its 2 buckets; previous is trimmed to match, not 3.
		expect( metrics[ 0 ].current ).toHaveLength( 2 );
		// previousValue totals only the retained (leading) buckets: 300 + 400.
		expect( metrics[ 0 ].previousValue ).toBe( 700 );
		// Revenue sums the retained buckets (1.5 + 2.0); CPM is their weighted
		// average (3.5 / 700 * 1000), not the value over all three buckets.
		expect( metrics[ 2 ].previousValue ).toBeCloseTo( 3.5 );
		expect( metrics[ 1 ].previousValue ).toBeCloseTo( 5 );
	} );
} );
