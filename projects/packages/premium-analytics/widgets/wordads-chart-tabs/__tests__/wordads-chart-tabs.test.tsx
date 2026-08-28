/**
 * External dependencies
 */
import { queryClient } from '@jetpack-premium-analytics/data';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, renderHook, screen, waitFor, within } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import { setMockRouteSearch } from '../../../tests/js/route-test-utils';
import WordAdsChartTabsWidget from '../render';
import useWordAdsChart from '../use-wordads-chart';
import wordAdsChartTabsWidget, { type WordAdsChartTabsAttributes } from '../widget';
import type { ReportParams } from '@jetpack-premium-analytics/data';
import type { DataFormControlProps } from '@jetpack-premium-analytics/externals';
import type { ComponentType, ReactNode } from 'react';

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
// a matched route the real hook warns and throws.
jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

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

// Distinct data proves the comparison is omitted.
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
		expect( metrics[ 0 ].current ).toHaveLength( 2 );
		// Comparison is unsupported regardless of report parameters.
		expect( metrics[ 0 ].previous ).toBeUndefined();
		expect( metrics[ 0 ].previousValue ).toBeUndefined();
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

	it( 'draws no comparison even when the params carry one', async () => {
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

		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );

		expect( result.current.metrics[ 0 ].previous ).toBeUndefined();
		expect( result.current.metrics[ 0 ].previousValue ).toBeUndefined();
	} );
} );

describe( 'WordAdsChartTabsWidget', () => {
	beforeEach( () => {
		queryClient.clear();
		mockApiFetch.mockReset();
		mockApiFetch.mockResolvedValue( PRIMARY_RESPONSE );
	} );

	// A failed assertion would skip a reset written into the test body, leaking
	// the URL state to whatever runs next.
	afterEach( () => setMockRouteSearch( {} ) );

	// The widget's body carries no Group by control: the bucket size is the one
	// its header control saved, clamped to what this chart supports.
	it( 'buckets by the interval its attributes carry', async () => {
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

	// This chart draws day through year, so `hour` is the one interval the range
	// can still carry that it has no bucket for, and it clamps to the finest.
	it( 'clamps an unsupported interval to the closest supported bucket', async () => {
		render(
			<WordAdsChartTabsWidget
				attributes={ {
					reportParams: { from: '2026-06-29', to: '2026-06-30', interval: 'hour' },
				} }
			/>
		);

		await waitFor( () => expect( mockApiFetch ).toHaveBeenCalled() );

		const requestedPath = mockApiFetch.mock.calls[ 0 ][ 0 ].path as string;
		expect( requestedPath ).toContain( 'unit=day' );
	} );

	/*
	 * The Ads default layout saves this widget with no attributes, and
	 * `WidgetRoot` falls back to the URL for a missing `reportParams` — the
	 * section date state this widget no longer follows. The fallback in
	 * `render.tsx` must win over the URL.
	 */
	it( 'ignores the URL range for an instance saved without report params', async () => {
		setMockRouteSearch( { from: '2020-01-01', to: '2020-01-31', interval: 'month' } );

		render( <WordAdsChartTabsWidget attributes={ {} } /> );

		await waitFor( () => expect( mockApiFetch ).toHaveBeenCalled() );
		const requestedPath = mockApiFetch.mock.calls[ 0 ][ 0 ].path as string;
		expect( requestedPath ).not.toContain( 'date=2020-01-31' );
	} );

	// The widget scopes itself with `offersComparison={ false }`, so `WidgetRoot`
	// strips the comparison params before the chart fetches — stripped params
	// must mean no second request, not a request with the dates removed.
	it( 'issues one request even when its attributes carry a comparison', async () => {
		render(
			<WordAdsChartTabsWidget
				attributes={ {
					reportParams: {
						from: '2026-05-01',
						to: '2026-06-30',
						interval: 'month',
						comp: '1',
						compare_from: '2026-03-01',
						compare_to: '2026-03-31',
					},
				} }
			/>
		);

		await waitFor( () => expect( mockApiFetch ).toHaveBeenCalled() );
		await waitFor( () => expect( mockApiFetch ).toHaveBeenCalledTimes( 1 ) );
	} );
} );

describe( 'WordAdsChartTabsWidget date control', () => {
	type FieldProps = DataFormControlProps< WordAdsChartTabsAttributes >;

	// Only the DataForm plumbing is cast away, so `data` stays type-checked and a
	// renamed attribute breaks the build rather than passing silently.
	function renderDateControl( props: Pick< FieldProps, 'data' | 'onChange' > ) {
		const [ { Edit } ] = wordAdsChartTabsWidget.attributes;
		const Field = Edit as ComponentType< FieldProps >;

		render( <Field { ...( props as FieldProps ) } /> );
	}

	it( 'offers no window shorter than the report can fill', async () => {
		const user = userEvent.setup();
		const onChange = jest.fn();

		renderDateControl( {
			data: { reportParams: { preset: 'last-30-days', interval: 'day' } },
			onChange,
		} );

		const toolbar = screen.getByRole( 'toolbar', { name: 'Date range' } );

		expect(
			within( toolbar )
				.getAllByRole( 'button' )
				.map( button => button.textContent )
		).toEqual( [ '7 days', '30 days', '12 months', 'Custom' ] );
		expect( screen.getByRole( 'button', { name: '30 days' } ) ).toHaveAttribute(
			'aria-pressed',
			'true'
		);

		await user.click( screen.getByRole( 'button', { name: '7 days' } ) );

		expect( onChange ).toHaveBeenCalledWith( {
			reportParams: expect.objectContaining( { preset: 'last-7-days' } ),
		} );
	} );

	it( 'moves an instance saved on the last 24 hours onto an offered window', () => {
		const onChange = jest.fn();

		renderDateControl( {
			data: { reportParams: { preset: 'last-24-hours', interval: 'hour' } },
			onChange,
		} );

		expect( onChange ).toHaveBeenCalledWith( {
			reportParams: expect.objectContaining( { preset: 'last-30-days' } ),
		} );
	} );

	// The menu and `render.tsx` read the same grain, so this fails if the widget
	// stops handing it over.
	it( 'offers no bucket the chart cannot draw', async () => {
		const user = userEvent.setup();

		// Two to six days is the window that puts hours on offer.
		renderDateControl( {
			data: {
				reportParams: { from: '2026-06-01', to: '2026-06-03T23:59:59', interval: 'day' },
			},
			onChange: jest.fn(),
		} );

		await user.click( await screen.findByRole( 'button', { name: 'Chart interval' } ) );

		expect( screen.getAllByRole( 'menuitemradio' ).map( item => item.textContent ) ).toEqual( [
			'By days',
		] );
	} );

	it( 'offers months alone on its longest window', async () => {
		const user = userEvent.setup();

		renderDateControl( {
			data: { reportParams: { preset: 'last-12-months', interval: 'month' } },
			onChange: jest.fn(),
		} );

		await user.click( await screen.findByRole( 'button', { name: 'Chart interval' } ) );

		expect( screen.getAllByRole( 'menuitemradio' ).map( item => item.textContent ) ).toEqual( [
			'By months',
		] );
	} );
} );
