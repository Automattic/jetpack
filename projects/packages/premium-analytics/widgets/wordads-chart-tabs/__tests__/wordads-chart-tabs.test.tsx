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

	it( 'builds Impressions, Revenue, and Avg. CPM tabs from the summary totals', async () => {
		const reportParams: ReportParams = {
			from: '2026-05-01',
			to: '2026-06-30',
			interval: 'month',
		};

		const { result } = renderHook( () => useWordAdsChart( reportParams, 'month' ), { wrapper } );

		await waitFor( () => expect( result.current.isFetching ).toBe( false ) );

		const metrics = result.current.metrics;
		expect( metrics.map( metric => metric.key ) ).toEqual( [ 'impressions', 'revenue', 'cpm' ] );
		expect( metrics.map( metric => metric.label ) ).toEqual( [
			'Impressions',
			'Revenue',
			'Avg. CPM',
		] );
		expect( metrics[ 0 ].value ).toBe( 2000 );
		expect( metrics[ 1 ].value ).toBeCloseTo( 9.75 );
		expect( metrics[ 2 ].value ).toBeCloseTo( 4.875 );
		// Currency format only on revenue/CPM; impressions falls back to the chart default.
		expect( metrics[ 0 ].dataFormat ).toBeUndefined();
		expect( metrics[ 1 ].dataFormat?.type ).toBe( 'currency' );
		expect( metrics[ 2 ].dataFormat?.type ).toBe( 'currency' );
		// One chart point per period; no comparison overlay without comparison params.
		expect( metrics[ 0 ].current ).toHaveLength( 2 );
		expect( metrics[ 0 ].previous ).toBeUndefined();
		expect( metrics[ 0 ].previousValue ).toBeUndefined();
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
		expect( metrics[ 1 ].previousValue ).toBeCloseTo( 2 );

		const requestedPaths = mockApiFetch.mock.calls.map(
			( [ { path } ]: [ { path: string } ] ) => path
		);
		expect( requestedPaths.some( p => p.includes( 'date=2026-06-30' ) ) ).toBe( true );
		expect( requestedPaths.some( p => p.includes( 'date=2026-03-31' ) ) ).toBe( true );
	} );
} );
