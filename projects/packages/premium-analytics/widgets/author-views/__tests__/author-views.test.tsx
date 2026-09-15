/**
 * External dependencies
 */
import { getDefaultQueryParams, queryClient } from '@jetpack-premium-analytics/data';
import { render, screen } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import AuthorViewsWidget from '../render';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

// The chart itself is visx SVG rendering, outside this widget's concern. Keep
// the metrics observable so the tests can assert what the widget charts.
jest.mock( '@jetpack-premium-analytics/widgets-toolkit', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/widgets-toolkit' ),
	MetricTabsChart: ( {
		metrics,
		chartType,
	}: {
		metrics: {
			key: string;
			label: string;
			value: number;
			current: { date: Date; value: number }[];
		}[];
		chartType?: string;
	} ) => (
		<div
			data-testid="metric-tabs-chart"
			data-chart-type={ String( chartType ) }
			data-metrics={ JSON.stringify(
				metrics.map( metric => ( {
					label: metric.label,
					value: metric.value,
					values: metric.current.map( point => point.value ),
					dates: metric.current.map( point => point.date.toISOString().slice( 0, 10 ) ),
				} ) )
			) }
		/>
	),
} ) );

// WidgetRoot reads URL search params as a fallback for report params; outside
// a matched route the real hook warns and throws.
jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

const mockApiFetch = apiFetch as unknown as jest.Mock;

function chartedMetrics( chart: HTMLElement ) {
	return JSON.parse( chart.getAttribute( 'data-metrics' ) ?? '[]' ) as {
		label: string;
		value: number;
		values: number[];
		dates: string[];
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

// Raw `stats/top-authors` with `summarize=0`: one bucket per day, every author
// in each. Author 7 is absent on the 2nd, which is a genuine zero.
const TOP_AUTHORS_DAYS = {
	date: '2026-07-03',
	period: 'day',
	days: {
		'2026-07-03': {
			authors: [
				{ name: 'Priya', author_id: 7, views: 5, posts: [] },
				{ name: 'Other', author_id: 3, views: 9, posts: [] },
			],
		},
		'2026-07-02': { authors: [ { name: 'Other', author_id: 3, views: 4, posts: [] } ] },
		'2026-07-01': { authors: [ { name: 'Priya', author_id: 7, views: 2, posts: [] } ] },
	},
};

describe( 'AuthorViewsWidget', () => {
	beforeEach( () => {
		queryClient.clear();
		mockApiFetch.mockReset();
	} );

	it( 'charts the author’s views per bucket, oldest first, and totals them', async () => {
		mockApiFetch.mockResolvedValue( TOP_AUTHORS_DAYS );

		render( <AuthorViewsWidget attributes={ { reportParams: WINDOW_PARAMS } } /> );

		const chart = await screen.findByTestId( 'metric-tabs-chart' );
		const [ metric ] = chartedMetrics( chart );
		expect( metric.label ).toBe( 'Views' );
		expect( metric.dates ).toEqual( [ '2026-07-01', '2026-07-02', '2026-07-03' ] );
		expect( metric.values ).toEqual( [ 2, 0, 5 ] );
		expect( metric.value ).toBe( 7 );
		expect( chart ).toHaveAttribute( 'data-chart-type', 'line' );

		const requestedPath = decodeURIComponent( mockApiFetch.mock.calls[ 0 ][ 0 ].path as string );
		expect( requestedPath ).toContain( 'stats/top-authors' );
		expect( requestedPath ).toContain( 'summarize=0' );
		expect( requestedPath ).toContain( 'max=0' );
		expect( requestedPath ).toContain( 'period=day' );
	} );

	it( 'sums daily buckets into the page’s weekly buckets, keeping a partial first week', async () => {
		mockApiFetch.mockResolvedValue( {
			...TOP_AUTHORS_DAYS,
			days: {
				'2026-06-22': { authors: [ { name: 'Priya', author_id: 7, views: 3, posts: [] } ] },
				'2026-06-19': { authors: [ { name: 'Priya', author_id: 7, views: 4, posts: [] } ] },
				'2026-06-18': { authors: [ { name: 'Priya', author_id: 7, views: 2, posts: [] } ] },
			},
		} );

		// 28 days from a Thursday: the shortest window that keeps a weekly interval,
		// starting mid-week so the first bucket is partial.
		render(
			<AuthorViewsWidget
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
		// The endpoint is always asked for days; the weeks are summed here.
		expect( decodeURIComponent( mockApiFetch.mock.calls[ 0 ][ 0 ].path as string ) ).toContain(
			'period=day'
		);
	} );

	it( 'draws bars when the chartType attribute says so', async () => {
		mockApiFetch.mockResolvedValue( TOP_AUTHORS_DAYS );

		render(
			<AuthorViewsWidget attributes={ { reportParams: WINDOW_PARAMS, chartType: 'bar' } } />
		);

		await expect( screen.findByTestId( 'metric-tabs-chart' ) ).resolves.toHaveAttribute(
			'data-chart-type',
			'bar'
		);
	} );

	it( 'renders the scopeless empty state and makes no request without an author scope', async () => {
		render( <AuthorViewsWidget attributes={ { reportParams: DEFAULT_PARAMS } } /> );

		await expect(
			screen.findByText( 'Open an author to see their views here.' )
		).resolves.toBeInTheDocument();
		expect( mockApiFetch ).not.toHaveBeenCalled();
	} );

	it( 'surfaces a retryable error when the request fails', async () => {
		mockApiFetch.mockRejectedValue( { error: 'unauthorized', status: 403 } );

		render( <AuthorViewsWidget attributes={ { reportParams: WINDOW_PARAMS } } /> );

		await expect(
			screen.findByText( "We couldn't load this author's views. Please try again in a moment." )
		).resolves.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Retry' } ) ).toBeInTheDocument();
	} );
} );
