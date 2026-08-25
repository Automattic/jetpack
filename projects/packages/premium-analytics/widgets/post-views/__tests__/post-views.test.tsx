/**
 * External dependencies
 */
import { getDefaultQueryParams, queryClient } from '@jetpack-premium-analytics/data';
import { render, screen } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { getSettings, setSettings } from '@wordpress/date';
/**
 * Internal dependencies
 */
import PostViewsWidget from '../render';

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
			dataFormat?: { type: string };
		}[];
		chartType?: string;
	} ) => (
		<div
			data-testid="metric-tabs-chart"
			data-chart-type={ String( chartType ) }
			data-metrics={ JSON.stringify(
				metrics.map( metric => ( {
					key: metric.key,
					label: metric.label,
					value: metric.value,
					format: metric.dataFormat?.type,
					values: metric.current.map( point => point.value ),
					firstDate: metric.current[ 0 ]?.date.toISOString(),
				} ) )
			) }
		/>
	),
} ) );

// WidgetRoot reads URL search params as a fallback for report params; outside
// a matched route the real hook warns and throws.
jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

const mockApiFetch = apiFetch as unknown as jest.Mock;

type ChartedMetric = {
	key: string;
	label: string;
	value: number;
	format?: string;
	values: number[];
	firstDate?: string;
};

/**
 * Parse the mocked chart's serialized metric tabs.
 */
function chartedMetrics( chart: HTMLElement ): ChartedMetric[] {
	return JSON.parse( chart.getAttribute( 'data-metrics' ) ?? '[]' );
}

// Raw `stats/post/{id}` shape: the daily view history as [date, views] pairs.
const STATS_POST_RESPONSE = {
	data: [
		[ '2026-06-25', 9 ],
		[ '2026-07-02', 5 ],
		[ '2026-07-04', 7 ],
	],
};

// Strip the default `preset`: report-param consumers recompute the range from
// it, which would override the fixed window these assertions depend on.
const DEFAULT_PARAMS = { ...getDefaultQueryParams( false ), preset: undefined };

const WINDOW_PARAMS = {
	...DEFAULT_PARAMS,
	from: '2026-07-01T00:00:00.000+08:00',
	to: '2026-07-07T23:59:59.999+08:00',
	post_id: 779,
};

// A 28-day window, the shortest that allows a weekly interval: `WidgetRoot`
// normalizes report params through `resolveIntervalForRange`, so an interval
// the range disallows is coerced away before the widget ever sees it.
const WEEKLY_WINDOW_PARAMS = {
	...DEFAULT_PARAMS,
	from: '2026-06-22T00:00:00.000+08:00',
	to: '2026-07-19T23:59:59.999+08:00',
	interval: 'week',
	post_id: 779,
};

describe( 'PostViewsWidget', () => {
	beforeEach( () => {
		// The data package's query client is a module-level singleton; drop its
		// cache so each test starts from a fresh fetch.
		queryClient.clear();
		mockApiFetch.mockReset();
	} );

	it( 'charts the window as a single zero-filled Views series', async () => {
		mockApiFetch.mockResolvedValue( STATS_POST_RESPONSE );

		render( <PostViewsWidget attributes={ { reportParams: WINDOW_PARAMS } } /> );

		const chart = await screen.findByTestId( 'metric-tabs-chart' );
		const metrics = chartedMetrics( chart );
		expect( metrics ).toHaveLength( 1 );
		expect( metrics[ 0 ].label ).toBe( 'Views' );
		// One point per calendar day of the 7-day window, zero-filled around the
		// two in-window days; the 6/25 day falls outside the window.
		expect( metrics[ 0 ].values ).toEqual( [ 0, 5, 0, 7, 0, 0, 0 ] );
		// The metric headline is the window total, and the chart type
		// defaults to line.
		expect( metrics[ 0 ].value ).toBe( 12 );
		expect( chart ).toHaveAttribute( 'data-chart-type', 'line' );

		const requestedPath = mockApiFetch.mock.calls[ 0 ][ 0 ].path as string;
		expect( requestedPath ).toContain( 'stats/post/779' );
	} );

	it( 'anchors bucket days at site-local midnight so negative-offset sites keep the calendar day', async () => {
		// A UTC-12 site: a date-only bucket key parsed as UTC midnight would
		// render as the previous day once formatted in the site timezone. The
		// point instant must be the key's site-local midnight instead.
		const defaultSettings = getSettings();
		setSettings( {
			...defaultSettings,
			timezone: { offset: -12, offsetFormatted: '-12', string: '', abbr: '' },
		} );

		try {
			mockApiFetch.mockResolvedValue( STATS_POST_RESPONSE );

			render( <PostViewsWidget attributes={ { reportParams: WINDOW_PARAMS } } /> );

			const chart = await screen.findByTestId( 'metric-tabs-chart' );
			// 2026-07-01 site-local midnight at UTC-12 is 2026-07-01T12:00:00Z.
			expect( chartedMetrics( chart )[ 0 ].firstDate ).toBe( '2026-07-01T12:00:00.000Z' );
		} finally {
			setSettings( defaultSettings );
		}
	} );

	it( 'buckets views into ISO weeks when the page interval is weekly', async () => {
		mockApiFetch.mockResolvedValue( STATS_POST_RESPONSE );

		render( <PostViewsWidget attributes={ { reportParams: WEEKLY_WINDOW_PARAMS } } /> );

		// 2026-06-22 → 2026-07-19 spans four ISO weeks: Mon 6/22 (9 views),
		// Mon 6/29 (5 + 7), Mon 7/6 and Mon 7/13 (zero).
		const chart = await screen.findByTestId( 'metric-tabs-chart' );
		expect( chartedMetrics( chart )[ 0 ].values ).toEqual( [ 9, 12, 0, 0 ] );
	} );

	it( 'draws bars when the chartType attribute says so', async () => {
		mockApiFetch.mockResolvedValue( STATS_POST_RESPONSE );

		render( <PostViewsWidget attributes={ { reportParams: WINDOW_PARAMS, chartType: 'bar' } } /> );

		const chart = await screen.findByTestId( 'metric-tabs-chart' );
		expect( chart ).toHaveAttribute( 'data-chart-type', 'bar' );
	} );

	it( 'ignores comparison report params: one request, single series', async () => {
		mockApiFetch.mockResolvedValue( STATS_POST_RESPONSE );

		render(
			<PostViewsWidget
				attributes={ {
					reportParams: {
						...WINDOW_PARAMS,
						// Comparison params pass through the post detail URL untouched
						// (dashboard state survives the round trip), so a widget
						// receiving them must neither draw an overlay nor change the
						// primary series — the page renders no comparison.
						comp: '1',
						compare_from: '2026-06-24T00:00:00.000+08:00',
						compare_to: '2026-06-30T23:59:59.999+08:00',
					},
				} }
			/>
		);

		const chart = await screen.findByTestId( 'metric-tabs-chart' );
		const metrics = chartedMetrics( chart );
		expect( metrics ).toHaveLength( 1 );
		expect( metrics[ 0 ].label ).toBe( 'Views' );
		expect( metrics[ 0 ].values ).toEqual( [ 0, 5, 0, 7, 0, 0, 0 ] );
		expect( mockApiFetch ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'renders the scopeless empty state and makes no request without a post scope', async () => {
		render( <PostViewsWidget attributes={ {} } /> );

		await expect(
			screen.findByText( 'Open a post or page report to see its views here.' )
		).resolves.toBeInTheDocument();
		expect(
			mockApiFetch.mock.calls.filter( call =>
				( call[ 0 ].path as string ).includes( 'stats/post' )
			)
		).toHaveLength( 0 );
	} );

	it( 'shows the error state with a Retry action when the fetch fails', async () => {
		// A non-retryable 403 so React Query surfaces the error immediately
		// instead of after the retry backoff.
		mockApiFetch.mockRejectedValue( { status: 403, message: 'Forbidden' } );

		render( <PostViewsWidget attributes={ { reportParams: WINDOW_PARAMS } } /> );

		await expect(
			screen.findByText( /couldn't load this post's views/ )
		).resolves.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Retry' } ) ).toBeInTheDocument();
	} );
} );
