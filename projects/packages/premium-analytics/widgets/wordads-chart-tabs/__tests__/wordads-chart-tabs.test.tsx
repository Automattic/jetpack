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
		tooltipMetrics,
	}: {
		metrics: {
			key: string;
			label: string;
			value: number;
			current: { date: Date; value: number }[];
			dataFormat?: { type: string };
		}[];
		chartType?: string;
		tooltipMetrics?: string;
	} ) => (
		<div
			data-testid="metric-tabs-chart"
			data-chart-type={ String( chartType ) }
			data-tooltip-metrics={ String( tooltipMetrics ) }
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

// Raw WPCOM `wordads/stats` matrix: two monthly buckets, summing to impressions
// 2000 / revenue 9.75, with CPM the weighted average 4.875.
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
		jest.useFakeTimers();
		// The data package's query client is a module-level singleton; drop its
		// cache so each test starts from a fresh fetch.
		queryClient.clear();
		mockApiFetch.mockReset();
		mockApiFetch.mockResolvedValue( PRIMARY_RESPONSE );
	} );

	afterEach( () => jest.useRealTimers() );

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
		expect( metrics.map( metric => metric.countLabel?.( 2 ) ) ).toEqual( [
			'%s Ads Served',
			undefined,
			undefined,
		] );
		expect( metrics[ 0 ].countLabel?.( 1 ) ).toBe( '%s Ad Served' );
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

	it( 'resolves a period without rows to tabs with no points', async () => {
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

		expect( result.current.isLoading ).toBe( true );

		await waitFor( () => expect( result.current.isLoading ).toBe( false ) );

		expect( result.current.metrics[ 0 ].current ).toHaveLength( 0 );
	} );

	it( 'leaves a gap in the CPM series where no ads were served', async () => {
		mockApiFetch.mockResolvedValue( {
			unit: 'month',
			fields: [ 'period', 'impressions', 'revenue', 'cpm' ],
			data: [
				[ '2026-05', 0, 0, 0 ],
				[ '2026-06', 800, 3.25, 4.06 ],
			],
		} );

		const reportParams: ReportParams = { from: '2026-05-01', to: '2026-06-30', interval: 'month' };
		const { result } = renderHook( () => useWordAdsChart( reportParams, 'month' ), { wrapper } );

		await waitFor( () => expect( result.current.isFetching ).toBe( false ) );

		const [ impressions, cpm, revenue ] = result.current.metrics;
		expect( cpm.current.map( point => point.value ) ).toEqual( [ null, 4.06 ] );
		expect( cpm.unavailable ).toBeUndefined();
		expect( impressions.current.map( point => point.value ) ).toEqual( [ 0, 800 ] );
		expect( revenue.current.map( point => point.value ) ).toEqual( [ 0, 3.25 ] );
	} );

	it( 'marks CPM unavailable when no ads were served in the whole range', async () => {
		mockApiFetch.mockResolvedValue( {
			unit: 'month',
			fields: [ 'period', 'impressions', 'revenue', 'cpm' ],
			data: [
				[ '2026-05', 0, 0, 0 ],
				[ '2026-06', 0, 0, 0 ],
			],
		} );

		const reportParams: ReportParams = { from: '2026-05-01', to: '2026-06-30', interval: 'month' };
		const { result } = renderHook( () => useWordAdsChart( reportParams, 'month' ), { wrapper } );

		await waitFor( () => expect( result.current.isFetching ).toBe( false ) );

		const [ impressions, cpm, revenue ] = result.current.metrics;
		expect( cpm.unavailable ).toEqual( expect.any( String ) );
		expect( impressions.unavailable ).toBeUndefined();
		expect( revenue.unavailable ).toBeUndefined();
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

	// Each saved interval is one the old bucket control could store for its window.
	it.each( [
		[ 'two months', { from: '2026-05-01', to: '2026-06-30', interval: 'week' }, 'day' ],
		[ 'four months', { from: '2026-03-02', to: '2026-06-30', interval: 'month' }, 'week' ],
		[ 'over three years', { from: '2023-01-01', to: '2026-06-30', interval: 'year' }, 'month' ],
	] as const )(
		'buckets %s by its length, not by a saved interval',
		async ( _window, reportParams, unit ) => {
			render( <WordAdsChartTabsWidget attributes={ { reportParams } } /> );

			await waitFor( () => expect( mockApiFetch ).toHaveBeenCalled() );

			const requestedPath = mockApiFetch.mock.calls[ 0 ][ 0 ].path as string;
			expect( requestedPath ).toContain( `unit=${ unit }` );
		}
	);

	// A window under two days allows hours alone, which this chart has no bucket for.
	it( 'draws a day-long window by day', async () => {
		render(
			<WordAdsChartTabsWidget
				attributes={ { reportParams: { from: '2026-06-29', to: '2026-06-30' } } }
			/>
		);

		await waitFor( () => expect( mockApiFetch ).toHaveBeenCalled() );

		const requestedPath = mockApiFetch.mock.calls[ 0 ][ 0 ].path as string;
		expect( requestedPath ).toContain( 'unit=day' );
	} );

	it( 'draws the chart type its attributes carry', async () => {
		render(
			<WordAdsChartTabsWidget
				attributes={ {
					reportParams: { from: '2026-05-01', to: '2026-06-30' },
					chartType: 'bar',
				} }
			/>
		);

		await expect( screen.findByTestId( 'metric-tabs-chart' ) ).resolves.toHaveAttribute(
			'data-chart-type',
			'bar'
		);
	} );

	/*
	 * The Ads default layout saves this widget with no attributes; `render.tsx`'s
	 * own fallback must win over WidgetRoot's URL fallback for a missing `reportParams`.
	 */
	it( 'ignores the URL range for an instance saved without report params', async () => {
		setMockRouteSearch( { from: '2020-01-01', to: '2020-01-31', interval: 'month' } );

		render( <WordAdsChartTabsWidget attributes={ {} } /> );

		await waitFor( () => expect( mockApiFetch ).toHaveBeenCalled() );
		const requestedPath = mockApiFetch.mock.calls[ 0 ][ 0 ].path as string;
		expect( requestedPath ).not.toContain( 'date=2020-01-31' );
	} );

	// `offersComparison={ false }` makes `WidgetRoot` strip comparison params before
	// the fetch — that must mean no second request, not one with the dates removed.
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

		await user.click( screen.getByRole( 'button', { name: 'Last 30 days' } ) );

		const menu = screen.getByRole( 'menu', { name: 'Period' } );

		expect(
			within( menu )
				.getAllByRole( 'menuitemradio' )
				.map( item => item.textContent )
		).toEqual( [ 'Last 7 days', 'Last 30 days', 'Last 12 months', 'Custom range' ] );
		expect( screen.getByRole( 'menuitemradio', { name: 'Last 30 days' } ) ).toBeChecked();

		await user.click( screen.getByRole( 'menuitemradio', { name: 'Last 7 days' } ) );

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

	it( 'offers the window alone, with no bucket control', async () => {
		renderDateControl( {
			data: { reportParams: { preset: 'last-12-months', interval: 'month' } },
			onChange: jest.fn(),
		} );

		await expect(
			screen.findByRole( 'button', { name: 'Last 12 months' } )
		).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: /^Chart interval/ } ) ).not.toBeInTheDocument();
	} );

	// The host draws the header fields in order, as the Subscribers chart does.
	it( 'follows the date range with the chart type', () => {
		expect( wordAdsChartTabsWidget.attributes.map( ( { id } ) => id ) ).toEqual( [
			'reportParams',
			'chartType',
		] );
	} );
} );

describe( 'WordAdsChartTabsWidget tooltip', () => {
	beforeEach( () => {
		queryClient.clear();
		mockApiFetch.mockReset();
		mockApiFetch.mockResolvedValue( PRIMARY_RESPONSE );
	} );

	afterEach( () => setMockRouteSearch( {} ) );

	// Classic's WordAds chart lists ads served, CPM and revenue together on hover,
	// whichever tab is selected.
	it( 'reads every metric out on hover', async () => {
		render(
			<WordAdsChartTabsWidget
				attributes={ {
					reportParams: { from: '2026-05-01', to: '2026-06-30', interval: 'day' },
				} }
			/>
		);

		await expect( screen.findByTestId( 'metric-tabs-chart' ) ).resolves.toHaveAttribute(
			'data-tooltip-metrics',
			'all'
		);
	} );
} );
