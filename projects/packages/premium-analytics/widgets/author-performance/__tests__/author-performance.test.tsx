/**
 * External dependencies
 */
import { getDefaultQueryParams, queryClient } from '@jetpack-premium-analytics/data';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import type { ReactNode } from 'react';
/**
 * Internal dependencies
 */
import AuthorPerformanceWidget from '../render';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

// The chart itself is visx SVG rendering, outside this widget's concern. Keep
// the metrics observable so the tests can assert what the widget charts.
jest.mock( '@jetpack-premium-analytics/widgets-toolkit', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/widgets-toolkit' ),
	MetricTabsChart: ( {
		metrics,
		chartType,
		empty,
	}: {
		metrics: {
			key: string;
			label: string;
			value: number;
			current: { date: Date; value: number }[];
			countLabel?: ( count: number ) => string;
			unavailable?: string;
			seriesUnavailable?: string;
		}[];
		chartType?: string;
		empty?: ReactNode;
	} ) => (
		<div
			data-testid="metric-tabs-chart"
			data-chart-type={ String( chartType ) }
			data-metrics={ JSON.stringify(
				metrics.map( metric => ( {
					label: metric.label,
					countLabels: [ metric.countLabel?.( 1 ), metric.countLabel?.( 2 ) ],
					value: metric.value,
					values: metric.current.map( point => point.value ),
					dates: metric.current.map( point => point.date.toISOString().slice( 0, 10 ) ),
					hasReason: !! metric.seriesUnavailable,
					unavailable: !! metric.unavailable,
				} ) )
			) }
		>
			{ empty }
		</div>
	),
} ) );

// WidgetRoot reads URL search params as a fallback for report params; outside
// a matched route the real hook warns and throws.
jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

const mockApiFetch = apiFetch as unknown as jest.Mock;

function chartedMetrics( chart: HTMLElement ) {
	return JSON.parse( chart.getAttribute( 'data-metrics' ) ?? '[]' ) as {
		label: string;
		countLabels: ( string | null )[];
		value: number;
		values: number[];
		dates: string[];
		hasReason: boolean;
		unavailable: boolean;
	}[];
}

// Strip the default `preset`: report-param consumers recompute the range from
// it, which would override the fixed window these assertions depend on.
const DEFAULT_PARAMS = { ...getDefaultQueryParams( false ), preset: undefined };

const WINDOW_PARAMS = {
	...DEFAULT_PARAMS,
	from: '2026-07-01T00:00:00.000+00:00',
	to: '2026-07-03T23:59:59.999+00:00',
	author_id: 7,
};

// `stats/author/7`: one bucket per period over the window, plus window totals.
const AUTHOR_DAYS = {
	date: '2026-07-03',
	start_date: '2026-07-01',
	period: 'day',
	views: 7,
	fields: [ 'period', 'views' ],
	data: [
		[ '2026-07-01', 2 ],
		[ '2026-07-02', 0 ],
		[ '2026-07-03', 5 ],
	],
	likes: 3,
	comments: 4,
};

describe( 'AuthorPerformanceWidget', () => {
	beforeEach( () => {
		queryClient.clear();
		mockApiFetch.mockReset();
	} );

	it( 'charts the author’s views per bucket and totals likes and comments without a series', async () => {
		mockApiFetch.mockResolvedValue( AUTHOR_DAYS );

		render( <AuthorPerformanceWidget attributes={ { reportParams: WINDOW_PARAMS } } /> );

		const chart = await screen.findByTestId( 'metric-tabs-chart' );
		const [ views, likes, comments ] = chartedMetrics( chart );
		expect( views ).toMatchObject( {
			label: 'Views',
			countLabels: [ '%s View', '%s Views' ],
			dates: [ '2026-07-01', '2026-07-02', '2026-07-03' ],
			values: [ 2, 0, 5 ],
			value: 7,
		} );
		expect( likes ).toMatchObject( { label: 'Likes', value: 3, values: [], hasReason: true } );
		expect( comments ).toMatchObject( {
			label: 'Comments',
			value: 4,
			values: [],
			hasReason: true,
		} );
		expect( chart ).toHaveAttribute( 'data-chart-type', 'bar' );

		const requestedPath = decodeURIComponent( mockApiFetch.mock.calls[ 0 ][ 0 ].path as string );
		expect( requestedPath ).toContain( 'stats/author/7' );
		expect( requestedPath ).toContain( 'period=day' );
		expect( requestedPath ).toContain( 'start_date=2026-07-01' );
		expect( requestedPath ).toContain( 'date=2026-07-03' );
		expect( requestedPath ).not.toContain( 'days=' );
	} );

	it( 'asks the endpoint for the page’s chart bucket and keeps a partial first week', async () => {
		// Week buckets are keyed at the calendar Monday, so the first one starts
		// before a window that opens on a Thursday.
		mockApiFetch.mockResolvedValue( {
			...AUTHOR_DAYS,
			period: 'week',
			views: 9,
			data: [
				[ '2026-06-15', 6 ],
				[ '2026-06-22', 3 ],
			],
		} );

		// 28 days from a Thursday: the shortest window that keeps a weekly interval.
		render(
			<AuthorPerformanceWidget
				attributes={ {
					reportParams: {
						...WINDOW_PARAMS,
						from: '2026-06-18T00:00:00.000+00:00',
						to: '2026-07-15T23:59:59.999+00:00',
						interval: 'week',
					},
				} }
			/>
		);

		const chart = await screen.findByTestId( 'metric-tabs-chart' );
		const [ metric ] = chartedMetrics( chart );
		expect( metric.dates ).toEqual( [ '2026-06-15', '2026-06-22' ] );
		expect( metric.values ).toEqual( [ 6, 3 ] );
		expect( metric.value ).toBe( 9 );
		expect( decodeURIComponent( mockApiFetch.mock.calls[ 0 ][ 0 ].path as string ) ).toContain(
			'period=week'
		);
	} );

	it( 'drops a bucket keyed by an impossible calendar day', async () => {
		mockApiFetch.mockResolvedValue( {
			...AUTHOR_DAYS,
			data: [ [ '2026-06-31', 99 ], ...AUTHOR_DAYS.data ],
		} );

		render( <AuthorPerformanceWidget attributes={ { reportParams: WINDOW_PARAMS } } /> );

		const [ metric ] = chartedMetrics( await screen.findByTestId( 'metric-tabs-chart' ) );
		expect( metric.dates ).toEqual( [ '2026-07-01', '2026-07-02', '2026-07-03' ] );
	} );

	it( 'marks likes and comments unavailable when the response carries no count', async () => {
		mockApiFetch.mockResolvedValue( { ...AUTHOR_DAYS, likes: undefined, comments: undefined } );

		render( <AuthorPerformanceWidget attributes={ { reportParams: WINDOW_PARAMS } } /> );

		const [ , likes, comments ] = chartedMetrics(
			await screen.findByTestId( 'metric-tabs-chart' )
		);
		expect( likes.unavailable ).toBe( true );
		expect( comments.unavailable ).toBe( true );
	} );

	it( 'names an author past the endpoint’s post limit without offering Retry', async () => {
		mockApiFetch.mockRejectedValue( { error: 'too_many_posts', status: 400 } );

		render( <AuthorPerformanceWidget attributes={ { reportParams: WINDOW_PARAMS } } /> );

		await expect(
			screen.findByText( 'This author has too many posts to count their stats here.' )
		).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'Retry' } ) ).not.toBeInTheDocument();
		expect( mockApiFetch ).toHaveBeenCalledTimes( 1 );
	} );

	it.each( [
		[ 'line', 'line' ],
		[ 'pie', 'bar' ],
	] )( 'draws a chartType attribute of %s as a %s chart', async ( chartType, drawn ) => {
		mockApiFetch.mockResolvedValue( AUTHOR_DAYS );

		render(
			<AuthorPerformanceWidget
				attributes={ { reportParams: WINDOW_PARAMS, chartType: chartType as never } }
			/>
		);

		await expect( screen.findByTestId( 'metric-tabs-chart' ) ).resolves.toHaveAttribute(
			'data-chart-type',
			drawn
		);
	} );

	it( 'hands the chart the no-results message as its empty state', async () => {
		mockApiFetch.mockResolvedValue( AUTHOR_DAYS );

		render( <AuthorPerformanceWidget attributes={ { reportParams: WINDOW_PARAMS } } /> );

		const chart = await screen.findByTestId( 'metric-tabs-chart' );
		expect(
			within( chart ).getByText( 'We couldn’t find results for this time period.' )
		).toBeInTheDocument();
	} );

	it( 'renders the scopeless empty state and makes no request without an author scope', async () => {
		render( <AuthorPerformanceWidget attributes={ { reportParams: DEFAULT_PARAMS } } /> );

		await expect(
			screen.findByText( 'Open an author to see their stats here.' )
		).resolves.toBeInTheDocument();
		expect( mockApiFetch ).not.toHaveBeenCalled();
	} );

	it( 'routes a permission-gated 403 through describeError: neutral copy, no retry', async () => {
		mockApiFetch.mockRejectedValue( { error: 'unauthorized', status: 403 } );

		render( <AuthorPerformanceWidget attributes={ { reportParams: WINDOW_PARAMS } } /> );

		await expect(
			screen.findByText( "You don't have access to this data." )
		).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'Retry' } ) ).not.toBeInTheDocument();
	} );

	it( 'refetches from the Retry action for a failure that can heal', async () => {
		// The proxy's `no_connection` 403 heals on reconnect and skips React Query's retry backoff.
		mockApiFetch.mockRejectedValue( { status: 403, code: 'no_connection' } );

		render( <AuthorPerformanceWidget attributes={ { reportParams: WINDOW_PARAMS } } /> );

		await expect(
			screen.findByText( "We couldn't load this author's stats. Please try again in a moment." )
		).resolves.toBeInTheDocument();

		mockApiFetch.mockResolvedValue( AUTHOR_DAYS );
		await userEvent.click( screen.getByRole( 'button', { name: 'Retry' } ) );

		await expect( screen.findByTestId( 'metric-tabs-chart' ) ).resolves.toBeInTheDocument();
	} );
} );
