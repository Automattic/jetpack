/**
 * External dependencies
 */
import { queryClient } from '@jetpack-premium-analytics/data';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import WordAdsChartTabsWidget from '../render';
import useWordAdsChart from '../use-wordads-chart';
import type { ReportParams } from '@jetpack-premium-analytics/data';
import type { ReactNode } from 'react';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

// The chart itself is visx SVG rendering, outside this widget's concern. Keep
// the metrics observable so the tests can assert what the widget charts.
jest.mock( '@jetpack-premium-analytics/widgets-toolkit', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/widgets-toolkit' ),
	MetricTabsChart: ( {
		metrics,
		chartType,
		pointsAreWallClocks,
	}: {
		metrics: {
			key: string;
			label: string;
			value: number;
			current: { date: Date; value: number }[];
			dataFormat?: { type: string };
		}[];
		chartType?: string;
		pointsAreWallClocks?: boolean;
	} ) => (
		<div
			data-testid="metric-tabs-chart"
			data-chart-type={ String( chartType ) }
			data-wall-clocks={ String( pointsAreWallClocks ) }
			data-metrics={ JSON.stringify(
				metrics.map( metric => ( {
					key: metric.key,
					label: metric.label,
					value: metric.value,
					format: metric.dataFormat?.type,
					values: metric.current.map( point => point.value ),
					firstDate: metric.current[ 0 ]?.date.toISOString(),
					days: metric.current.map( point => point.date.getDate() ),
				} ) )
			) }
		/>
	),
} ) );

// WidgetRoot reads URL search params as a fallback for report params; outside
// a matched route the real hook warns and throws. `useNavigate` is added on
// top of the shared mock: this widget also hosts its own `DateFiltersPanel`,
// whose `useReportDateFilters` calls it unconditionally on every render (the
// tests here never interact with the picker, so a stub is enough — see
// `__tests__/date-range-control.test.tsx` for the interactive coverage, which
// needs a real matched route via `RouteHarness` instead of this mock). The
// stub throws if actually invoked, rather than silently no-opping, so a future
// test in this file that triggers navigation fails loudly instead of passing
// while nothing happened.
jest.mock( '@wordpress/route', () => ( {
	...jest.requireActual( '../../test-utils' ).mockWordPressRoute,
	useNavigate:
		() =>
		( ...args: unknown[] ) => {
			throw new Error(
				`navigate is not available under the route mock (called with ${ JSON.stringify( args ) })`
			);
		},
} ) );

const mockApiFetch = apiFetch as unknown as jest.Mock;

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
		expect( metrics[ 0 ].current ).toHaveLength( 2 );
		expect( result.current.isEmpty ).toBe( false );
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
} );

describe( 'WordAdsChartTabsWidget', () => {
	beforeEach( () => {
		queryClient.clear();
		mockApiFetch.mockReset();
		mockApiFetch.mockResolvedValue( PRIMARY_RESPONSE );
	} );

	// The widget has no Group by control: the bucket size is whatever the
	// dashboard's chart interval control resolved to, clamped to what this
	// chart supports.
	it( 'buckets by the interval the dashboard applied', async () => {
		render(
			<WordAdsChartTabsWidget
				attributes={ {
					reportParams: { from: '2026-05-01', to: '2026-06-30', interval: 'week' },
				} }
			/>
		);

		await waitFor( () => expect( mockApiFetch ).toHaveBeenCalled() );

		const requestedPath = mockApiFetch.mock.calls[ 0 ][ 0 ].path as string;
		expect( requestedPath ).toContain( 'unit=week' );
	} );

	// `quarter` is an interval the dashboard allows on a multi-year range but
	// this chart has no bucket for, so it clamps to the nearest one it does.
	it( 'clamps an unsupported interval to the closest supported bucket', async () => {
		render(
			<WordAdsChartTabsWidget
				attributes={ {
					reportParams: { from: '2023-01-01', to: '2026-06-30', interval: 'quarter' },
				} }
			/>
		);

		await waitFor( () => expect( mockApiFetch ).toHaveBeenCalled() );

		const requestedPath = mockApiFetch.mock.calls[ 0 ][ 0 ].path as string;
		expect( requestedPath ).toContain( 'unit=month' );
	} );
} );
