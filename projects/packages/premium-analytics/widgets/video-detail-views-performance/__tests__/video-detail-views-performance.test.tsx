/**
 * External dependencies
 */
import { getDefaultQueryParams, queryClient } from '@jetpack-premium-analytics/data';
import { render, screen } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import VideoDetailViewsPerformanceWidget from '../render';

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

type ChartedMetric = {
	key: string;
	label: string;
	value: number;
	format?: string;
	values: number[];
	firstDate?: string;
	days: number[];
};

/**
 * Parse the mocked chart's serialized metric tabs.
 */
function chartedMetrics( chart: HTMLElement ): ChartedMetric[] {
	return JSON.parse( chart.getAttribute( 'data-metrics' ) ?? '[]' );
}

/**
 * Raw `statType=all` response shape (wpcom #229903): per-day tuples, with
 * impressions/watch-time derived from plays. The retention total is
 * play-weighted server-side, so the fixture computes the same weighting.
 */
function buildSingleVideoResponse( data: Array< [ string, number, number? ] > ) {
	const totalPlays = data.reduce( ( sum, [ , plays ] ) => sum + plays, 0 );
	const weightedRate = data.reduce( ( sum, [ , plays, rate = 50 ] ) => sum + plays * rate, 0 );

	return {
		fields: [ 'period', 'plays', 'impressions', 'watch_time', 'retention_rate' ],
		data: data.map( ( [ period, plays, rate = 50 ] ) => [
			period,
			plays,
			plays * 2,
			plays * 0.25,
			rate,
		] ),
		pages: [],
		post: { ID: 105, post_title: 'Selected video', post_mime_type: 'video/mp4' },
		total: {
			plays: totalPlays,
			impressions: totalPlays * 2,
			watch_time: totalPlays * 0.25,
			retention_rate: totalPlays > 0 ? weightedRate / totalPlays : 0,
		},
	};
}

/**
 * Routes a mocked request to the response for its `start_date` window. Keyed by
 * the requested calendar day, so the fixtures hold whether the param carries a
 * bare date or the full offset-bearing datetime the range resolves to.
 */
function respondByWindow( responsesByStartDay: Record< string, unknown > ) {
	return ( { path }: { path: string } ) => {
		const startDate = new URLSearchParams( path.split( '?' )[ 1 ] ).get( 'start_date' ) ?? '';
		const startDay = startDate.split( 'T' )[ 0 ];

		return Promise.resolve( responsesByStartDay[ startDay ] ?? buildSingleVideoResponse( [] ) );
	};
}

// Strip the default `preset`: report-param consumers recompute the range from
// it, which would override the fixed window these assertions depend on.
const DEFAULT_PARAMS = { ...getDefaultQueryParams( false ), preset: undefined };

const WINDOW_PARAMS = {
	...DEFAULT_PARAMS,
	from: '2026-07-01T00:00:00.000+08:00',
	to: '2026-07-07T23:59:59.999+08:00',
	post_id: 105,
};

// Distinct per-day retention rates prove play-weighting: the window's combined
// rate is (5×40 + 7×60) / 12 ≈ 51.67, not the raw 50 average.
const PRIMARY_WINDOW_RESPONSE = buildSingleVideoResponse( [
	[ '2026-07-02', 5, 40 ],
	[ '2026-07-04', 7, 60 ],
] );

// A 28-day window, the shortest that allows a weekly interval: `WidgetRoot`
// normalizes report params, coercing away an interval the range disallows.
const WEEKLY_WINDOW_PARAMS = {
	...DEFAULT_PARAMS,
	from: '2026-06-22T00:00:00.000+08:00',
	to: '2026-07-19T23:59:59.999+08:00',
	interval: 'week',
	post_id: 105,
};

// Distinct per-day retention rates in the second week prove play-weighting.
const WEEKLY_WINDOW_RESPONSE = buildSingleVideoResponse( [
	[ '2026-06-25', 9 ],
	[ '2026-07-02', 5, 40 ],
	[ '2026-07-04', 7, 60 ],
] );

describe( 'VideoDetailViewsPerformanceWidget', () => {
	beforeEach( () => {
		// The data package's query client is a module-level singleton; drop its
		// cache so each test starts from a fresh fetch.
		queryClient.clear();
		mockApiFetch.mockReset();
	} );

	it( 'charts the four metrics as zero-filled tabs headlined by the window totals', async () => {
		mockApiFetch.mockImplementation( respondByWindow( { '2026-07-01': PRIMARY_WINDOW_RESPONSE } ) );

		render( <VideoDetailViewsPerformanceWidget attributes={ { reportParams: WINDOW_PARAMS } } /> );

		const chart = await screen.findByTestId( 'metric-tabs-chart' );
		const metrics = chartedMetrics( chart );
		expect( metrics.map( metric => metric.label ) ).toEqual( [
			'Views',
			'Impressions',
			'Hours watched',
			'Retention rate',
		] );
		expect( chart ).toHaveAttribute( 'data-chart-type', 'line' );

		// One point per calendar day of the 7-day window, zero-filled around the
		// two returned days; the headline is the response's canonical total.
		const [ views, impressions, watchTime, retention ] = metrics;
		expect( views.values ).toEqual( [ 0, 5, 0, 7, 0, 0, 0 ] );
		expect( views.value ).toBe( 12 );
		expect( impressions.values ).toEqual( [ 0, 10, 0, 14, 0, 0, 0 ] );
		expect( impressions.value ).toBe( 24 );
		expect( watchTime.values ).toEqual( [ 0, 1.25, 0, 1.75, 0, 0, 0 ] );
		expect( watchTime.value ).toBe( 3 );

		// Retention charts as a fraction for the percentage format; zero-play days
		// have no measured retention, and the headline is the server's play-weighted total.
		expect( retention.format ).toBe( 'percentage' );
		expect( retention.values ).toEqual( [ 0, 0.4, 0, 0.6, 0, 0, 0 ] );
		expect( retention.value ).toBeCloseTo( ( 5 * 40 + 7 * 60 ) / 12 / 100, 10 );

		// Filtered to the widget's own requests: the first rendering test in the
		// file also triggers core-data's one-off site-settings resolution.
		const requestedPaths = mockApiFetch.mock.calls
			.map( call => call[ 0 ].path as string )
			.filter( path => path.includes( 'stats/video/105' ) );
		expect( requestedPaths ).toHaveLength( 1 );
		expect( requestedPaths[ 0 ] ).toContain( 'statType=all' );
		expect( requestedPaths[ 0 ] ).toContain( 'period=day' );
		// The unmodified report params: the request shape is shared with the rest of
		// the page (see use-video-metrics), so this pins the exact shape, not just the day.
		const requestedParams = new URLSearchParams( requestedPaths[ 0 ].split( '?' )[ 1 ] );
		expect( requestedParams.get( 'start_date' ) ).toBe( WINDOW_PARAMS.from );
		expect( requestedParams.get( 'date' ) ).toBe( WINDOW_PARAMS.to );
	} );

	// Pinned west of UTC: under a UTC runner the site and runner readings coincide,
	// so this would pass either way. `TZ` isn't on the typed env shape.
	it( 'builds bucket points on the bucket days the site names', async () => {
		const env = process.env as Record< string, string | undefined >;
		const runnerTimeZone = env.TZ;
		env.TZ = 'America/Los_Angeles';

		try {
			mockApiFetch.mockImplementation(
				respondByWindow( { '2026-07-01': PRIMARY_WINDOW_RESPONSE } )
			);

			render(
				<VideoDetailViewsPerformanceWidget attributes={ { reportParams: WINDOW_PARAMS } } />
			);

			const chart = await screen.findByTestId( 'metric-tabs-chart' );
			// Reading this UTC+8 window's midnights in Los Angeles would report the
			// previous day.
			expect( chartedMetrics( chart )[ 0 ].days ).toEqual( [ 1, 2, 3, 4, 5, 6, 7 ] );
		} finally {
			if ( runnerTimeZone === undefined ) {
				delete env.TZ;
			} else {
				env.TZ = runnerTimeZone;
			}
		}
	} );

	it( 'buckets each metric into ISO weeks when the page interval is weekly, play-weighting the retention rate', async () => {
		mockApiFetch.mockImplementation( respondByWindow( { '2026-06-22': WEEKLY_WINDOW_RESPONSE } ) );

		render(
			<VideoDetailViewsPerformanceWidget attributes={ { reportParams: WEEKLY_WINDOW_PARAMS } } />
		);

		// 2026-06-22 → 2026-07-19 spans four ISO weeks: Mon 6/22 (9 plays),
		// Mon 6/29 (5 + 7), Mon 7/6 and Mon 7/13 (zero).
		const chart = await screen.findByTestId( 'metric-tabs-chart' );
		const [ views, , , retention ] = chartedMetrics( chart );
		expect( views.values ).toEqual( [ 9, 12, 0, 0 ] );
		// The second week's retention is the plays-weighted combination of its two
		// days, not their raw average; the empty weeks have no measured retention.
		expect( retention.values[ 1 ] ).toBeCloseTo( ( 5 * 40 + 7 * 60 ) / 12 / 100, 10 );
		expect( retention.values[ 2 ] ).toBe( 0 );
	} );

	it( 'draws bars when the chartType attribute says so', async () => {
		mockApiFetch.mockImplementation( respondByWindow( { '2026-07-01': PRIMARY_WINDOW_RESPONSE } ) );

		render(
			<VideoDetailViewsPerformanceWidget
				attributes={ { reportParams: WINDOW_PARAMS, chartType: 'bar' } }
			/>
		);

		const chart = await screen.findByTestId( 'metric-tabs-chart' );
		expect( chart ).toHaveAttribute( 'data-chart-type', 'bar' );
	} );

	it( 'ignores comparison report params: one request, single-period series', async () => {
		mockApiFetch.mockImplementation( respondByWindow( { '2026-07-01': PRIMARY_WINDOW_RESPONSE } ) );

		render(
			<VideoDetailViewsPerformanceWidget
				attributes={ {
					reportParams: {
						...WINDOW_PARAMS,
						// The video detail URL carries comparison params through untouched,
						// but the page renders no comparison, so the widget must ignore them.
						comp: '1',
						compare_from: '2026-06-24T00:00:00.000+08:00',
						compare_to: '2026-06-30T23:59:59.999+08:00',
					},
				} }
			/>
		);

		const chart = await screen.findByTestId( 'metric-tabs-chart' );
		const metrics = chartedMetrics( chart );
		expect( metrics ).toHaveLength( 4 );
		expect( metrics[ 0 ].values ).toEqual( [ 0, 5, 0, 7, 0, 0, 0 ] );

		const requestedPaths = mockApiFetch.mock.calls
			.map( call => call[ 0 ].path as string )
			.filter( path => path.includes( 'stats/video/105' ) );
		expect( requestedPaths ).toHaveLength( 1 );
		expect( requestedPaths[ 0 ] ).toContain( 'start_date=2026-07-01' );
		expect( requestedPaths.some( path => path.includes( 'start_date=2026-06-24' ) ) ).toBe( false );
	} );

	it( 'omits the tabs for metrics missing from the response fields', async () => {
		// A response without named fields (e.g. a legacy single-metric shape) only
		// backs the Views series; the other tabs would be fabricated flatlines.
		mockApiFetch.mockImplementation( () =>
			Promise.resolve( {
				data: [
					[ '2026-07-02', 5 ],
					[ '2026-07-04', 7 ],
				],
				pages: [],
				post: null,
			} )
		);

		render( <VideoDetailViewsPerformanceWidget attributes={ { reportParams: WINDOW_PARAMS } } /> );

		const chart = await screen.findByTestId( 'metric-tabs-chart' );
		const metrics = chartedMetrics( chart );
		expect( metrics.map( metric => metric.label ) ).toEqual( [ 'Views' ] );
		expect( metrics[ 0 ].values ).toEqual( [ 0, 5, 0, 7, 0, 0, 0 ] );
		// No `total` in the response, so the headline falls back to the bucketed sum.
		expect( metrics[ 0 ].value ).toBe( 12 );
	} );

	it( 'renders the scopeless empty state and makes no request without a video scope', async () => {
		render( <VideoDetailViewsPerformanceWidget attributes={ {} } /> );

		await expect(
			screen.findByText( 'Open a video report to see its performance here.' )
		).resolves.toBeInTheDocument();
		expect(
			mockApiFetch.mock.calls.filter( call =>
				( call[ 0 ].path as string ).includes( 'stats/video' )
			)
		).toHaveLength( 0 );
	} );

	it( 'shows the error state with a Retry action when the fetch fails', async () => {
		// A 403 skips React Query's retry backoff so the error surfaces immediately;
		// `no_connection` keeps `describeError` on the retryable branch.
		mockApiFetch.mockRejectedValue( { status: 403, code: 'no_connection', message: 'Forbidden' } );

		render( <VideoDetailViewsPerformanceWidget attributes={ { reportParams: WINDOW_PARAMS } } /> );

		await expect(
			screen.findByText( /couldn't load this video's performance/ )
		).resolves.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Retry' } ) ).toBeInTheDocument();
	} );

	it( 'shows the permission error without a Retry action on a plain 403', async () => {
		mockApiFetch.mockRejectedValue( { status: 403, message: 'Forbidden' } );

		render( <VideoDetailViewsPerformanceWidget attributes={ { reportParams: WINDOW_PARAMS } } /> );

		await expect(
			screen.findByText( "You don't have access to this data." )
		).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'Retry' } ) ).not.toBeInTheDocument();
	} );
} );
