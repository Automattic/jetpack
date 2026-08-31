/**
 * External dependencies
 */
import { getDefaultQueryParams, queryClient } from '@jetpack-premium-analytics/data';
import { act, render, screen } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import EmailTimeSeriesWidget from '../render';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

// The chart itself is visx SVG rendering, outside this widget's concern. Keep
// the series observable so the tests can assert what the widget charts.
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
		}[];
		chartType?: string;
		pointsAreWallClocks?: boolean;
	} ) => (
		<div
			data-testid="metric-tabs-chart"
			data-metric-count={ metrics.length }
			data-metric-label={ metrics[ 0 ]?.label }
			data-metric-total={ String( metrics[ 0 ]?.value ) }
			data-values={ metrics[ 0 ]?.current.map( point => point.value ).join( ',' ) }
			data-days={ metrics[ 0 ]?.current.map( point => point.date.getDate() ).join( ',' ) }
			data-chart-type={ String( chartType ) }
			data-wall-clocks={ String( pointsAreWallClocks ) }
		/>
	),
} ) );

// WidgetRoot reads URL search params as a fallback for report params; outside
// a matched route the real hook warns and throws.
jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

const mockApiFetch = apiFetch as unknown as jest.Mock;

// The data layer trims buckets to the requested window, so a default
// (today-relative) preset would trim these fixed July dates away.
const JULY_WEEK_PARAMS = {
	...getDefaultQueryParams( false ),
	preset: undefined,
	from: '2026-07-01T00:00:00.000+08:00',
	to: '2026-07-07T23:59:59.999+08:00',
};

// Raw WPCOM `stats_fields=timeline` shape. 2026-07-04/05 fall in one ISO week
// and 2026-07-06 opens the next, so weekly grouping collapses the three rows
// into two buckets (15 and 7).
const OPENS_TIMELINE_RESPONSE = {
	timeline: {
		unit: 'day',
		fields: [ 'date', 'opens_count' ],
		data: [
			[ '2026-07-04', 10 ],
			[ '2026-07-05', 5 ],
			[ '2026-07-06', 7 ],
		],
	},
};

describe( 'EmailTimeSeriesWidget', () => {
	beforeEach( () => {
		// The data package's query client is a module-level singleton; drop its
		// cache so each test starts from a fresh fetch.
		queryClient.clear();
		mockApiFetch.mockReset();
	} );

	it( 'charts the selected email’s daily opens timeline', async () => {
		mockApiFetch.mockResolvedValue( OPENS_TIMELINE_RESPONSE );

		render(
			<EmailTimeSeriesWidget
				attributes={ {
					reportParams: { ...JULY_WEEK_PARAMS, post_id: 1234 },
					metric: 'opens',
				} }
			/>
		);

		const chart = await screen.findByTestId( 'metric-tabs-chart' );
		expect( chart ).toHaveAttribute( 'data-metric-label', 'Total opens' );
		expect( chart ).toHaveAttribute( 'data-values', '10,5,7' );
		expect( chart ).toHaveAttribute( 'data-metric-total', '22' );
		expect( chart ).toHaveAttribute( 'data-chart-type', 'line' );

		const requestedPath = mockApiFetch.mock.calls[ 0 ][ 0 ].path as string;
		expect( requestedPath ).toContain( 'stats/opens/emails/1234' );
		expect( requestedPath ).toContain( 'stats_fields=timeline' );
	} );

	// Pinned west of UTC on purpose: under a UTC runner the wall-clock reading
	// and the old instant reading coincide, so this would pass either way. `TZ`
	// is not on the typed env shape, hence the cast.
	it( 'builds chart points as the wall clocks the buckets name, declared to the chart', async () => {
		const env = process.env as Record< string, string | undefined >;
		const runnerTimeZone = env.TZ;
		env.TZ = 'America/Los_Angeles';

		try {
			mockApiFetch.mockResolvedValue( OPENS_TIMELINE_RESPONSE );

			render(
				<EmailTimeSeriesWidget
					attributes={ {
						reportParams: { ...JULY_WEEK_PARAMS, post_id: 1234 },
						metric: 'opens',
					} }
				/>
			);

			const chart = await screen.findByTestId( 'metric-tabs-chart' );
			// The old `localTZDate` reading anchors the buckets away from the
			// local frame, so these read as the previous day (3,4,5) under it.
			expect( chart ).toHaveAttribute( 'data-days', '4,5,6' );
			expect( chart ).toHaveAttribute( 'data-wall-clocks', 'true' );
		} finally {
			if ( runnerTimeZone === undefined ) {
				delete env.TZ;
			} else {
				env.TZ = runnerTimeZone;
			}
		}
	} );

	it( 'reads the clicks endpoint when metric is clicks', async () => {
		mockApiFetch.mockResolvedValue( {
			timeline: {
				unit: 'day',
				fields: [ 'date', 'clicks_count' ],
				data: [ [ '2026-07-04', 3 ] ],
			},
		} );

		render(
			<EmailTimeSeriesWidget
				attributes={ {
					reportParams: { ...JULY_WEEK_PARAMS, post_id: 1234 },
					metric: 'clicks',
				} }
			/>
		);

		const chart = await screen.findByTestId( 'metric-tabs-chart' );
		expect( chart ).toHaveAttribute( 'data-metric-label', 'Total clicks' );
		expect( chart ).toHaveAttribute( 'data-values', '3' );

		const requestedPath = mockApiFetch.mock.calls[ 0 ][ 0 ].path as string;
		expect( requestedPath ).toContain( 'stats/clicks/emails/1234' );
	} );

	it( 'draws exactly the selected hourly window from a midnight-anchored payload', async () => {
		// The endpoint anchors hourly buckets on the start day's midnight and returns
		// `quantity` buckets forward, so a last-24-hours window arrives as 33 buckets
		// from hour 0 and the widget must chart only the 24 in-window ones.
		mockApiFetch.mockResolvedValue( {
			timeline: {
				unit: 'hour',
				fields: [ 'date', 'hour', 'opens_count' ],
				data: [
					...Array.from( { length: 24 }, ( _, hour ) => [ '2026-07-04', hour, hour ] ),
					...Array.from( { length: 9 }, ( _, hour ) => [ '2026-07-05', hour, hour ] ),
				],
			},
		} );

		render(
			<EmailTimeSeriesWidget
				attributes={ {
					reportParams: {
						...getDefaultQueryParams( false ),
						preset: undefined,
						from: '2026-07-04T09:00:00.000+08:00',
						to: '2026-07-05T08:59:59.999+08:00',
						interval: 'hour',
						post_id: 1234,
					},
					metric: 'opens',
				} }
			/>
		);

		const chart = await screen.findByTestId( 'metric-tabs-chart' );
		const values = String( chart.getAttribute( 'data-values' ) ).split( ',' );
		expect( values ).toHaveLength( 24 );
		expect( values[ 0 ] ).toBe( '9' );
		expect( values[ 23 ] ).toBe( '8' );
		// Hours 9–23 of day one plus 0–8 of day two.
		expect( chart ).toHaveAttribute( 'data-metric-total', '276' );

		const requestedPath = String( mockApiFetch.mock.calls[ 0 ][ 0 ].path );
		const requestParams = new URLSearchParams( requestedPath.split( '?' )[ 1 ] );
		expect( requestParams.get( 'quantity' ) ).toBe( '33' );
		// The trim window is sanitizer-only and must never reach the API.
		expect( requestParams.get( 'window_start' ) ).toBeNull();
		expect( requestParams.get( 'window_end' ) ).toBeNull();
	} );

	it( 'ignores comparison report params: one request, single series', async () => {
		mockApiFetch.mockResolvedValue( OPENS_TIMELINE_RESPONSE );

		render(
			<EmailTimeSeriesWidget
				attributes={ {
					reportParams: {
						...getDefaultQueryParams( false ),
						preset: undefined,
						from: '2026-07-01T00:00:00.000+08:00',
						to: '2026-07-07T23:59:59.999+08:00',
						// The post detail URL carries comparison params through untouched,
						// but the page renders no comparison, so the widget must neither
						// fetch a second window nor draw an overlay.
						comp: '1',
						compare_from: '2026-06-24T00:00:00.000+08:00',
						compare_to: '2026-06-30T23:59:59.999+08:00',
						post_id: 1234,
					},
					metric: 'opens',
				} }
			/>
		);

		const chart = await screen.findByTestId( 'metric-tabs-chart' );
		expect( chart ).toHaveAttribute( 'data-metric-count', '1' );
		expect( chart ).toHaveAttribute( 'data-values', '10,5,7' );

		const requestedDates = mockApiFetch.mock.calls.map( call =>
			new URLSearchParams( String( call[ 0 ].path ).split( '?' )[ 1 ] ).get( 'date' )
		);
		expect( requestedDates ).toEqual( [ '2026-07-01T00:00:00.000+08:00' ] );
	} );

	it( 'aggregates the daily buckets into ISO weeks when the page interval is weekly', async () => {
		mockApiFetch.mockResolvedValue( OPENS_TIMELINE_RESPONSE );

		render(
			<EmailTimeSeriesWidget
				attributes={ {
					// A 35-day window (weekly needs >= 28 days) covering both ISO weeks.
					reportParams: {
						...getDefaultQueryParams( false ),
						preset: undefined,
						from: '2026-06-08T00:00:00.000+08:00',
						to: '2026-07-12T23:59:59.999+08:00',
						interval: 'week',
						post_id: 1234,
					},
					metric: 'opens',
				} }
			/>
		);

		const chart = await screen.findByTestId( 'metric-tabs-chart' );
		expect( chart ).toHaveAttribute( 'data-values', '15,7' );
	} );

	it( 'aggregates the daily buckets into calendar months when the page interval is monthly', async () => {
		mockApiFetch.mockResolvedValue( {
			timeline: {
				unit: 'day',
				fields: [ 'date', 'opens_count' ],
				data: [
					[ '2026-06-28', 4 ],
					[ '2026-07-04', 10 ],
					[ '2026-07-06', 5 ],
				],
			},
		} );

		render(
			<EmailTimeSeriesWidget
				attributes={ {
					// An explicit multi-month window: `WidgetRoot` normalizes report
					// params through `resolveIntervalForRange`, and the default
					// 30-day preset would coerce a monthly interval back to daily.
					reportParams: {
						...getDefaultQueryParams( false ),
						preset: undefined,
						from: '2026-05-01T00:00:00.000+08:00',
						to: '2026-08-31T23:59:59.999+08:00',
						interval: 'month',
						post_id: 1234,
					},
					metric: 'opens',
				} }
			/>
		);

		const chart = await screen.findByTestId( 'metric-tabs-chart' );
		expect( chart ).toHaveAttribute( 'data-values', '4,15' );
	} );

	it( 'renders the empty state when the timeline has no buckets', async () => {
		mockApiFetch.mockResolvedValue( {
			timeline: { unit: 'day', fields: [ 'date', 'opens_count' ], data: [] },
		} );

		render(
			<EmailTimeSeriesWidget
				attributes={ {
					reportParams: { ...getDefaultQueryParams( false ), post_id: 1234 },
					metric: 'opens',
				} }
			/>
		);

		await expect(
			screen.findByText( 'No activity for this email in this period.' )
		).resolves.toBeInTheDocument();
		expect( screen.queryByTestId( 'metric-tabs-chart' ) ).not.toBeInTheDocument();
	} );

	it( 'shows loading instead of the stale empty state once a new range drags on', async () => {
		const emptyResponse = {
			timeline: { unit: 'day', fields: [ 'date', 'opens_count' ], data: [] },
		};
		mockApiFetch
			.mockResolvedValueOnce( emptyResponse )
			// Keep the new range pending so its loading state is observable.
			.mockImplementationOnce( () => new Promise( () => {} ) );

		const { rerender } = render(
			<EmailTimeSeriesWidget
				attributes={ {
					reportParams: {
						...getDefaultQueryParams( false ),
						preset: undefined,
						from: '2026-07-01T00:00:00.000+08:00',
						to: '2026-07-07T23:59:59.999+08:00',
						post_id: 1234,
					},
					metric: 'opens',
				} }
			/>
		);

		await expect(
			screen.findByText( 'No activity for this email in this period.' )
		).resolves.toBeInTheDocument();

		// The skeleton waits out the shared delay, so drive it rather than
		// sleeping. Switched on here so the fetches above resolve normally.
		jest.useFakeTimers();
		rerender(
			<EmailTimeSeriesWidget
				attributes={ {
					reportParams: {
						...getDefaultQueryParams( false ),
						preset: undefined,
						from: '2026-08-01T00:00:00.000+08:00',
						to: '2026-08-07T23:59:59.999+08:00',
						post_id: 1234,
					},
					metric: 'opens',
				} }
			/>
		);
		act( () => {
			jest.advanceTimersByTime( 1000 );
		} );

		// The previous range's "no activity" is not an answer about this one, so
		// it gives way to the skeleton.
		expect( screen.getByTestId( 'widget-skeleton' ) ).toBeInTheDocument();
		expect(
			screen.queryByText( 'No activity for this email in this period.' )
		).not.toBeInTheDocument();
		jest.useRealTimers();
	} );

	it( 'renders the empty state and makes no request without a selected email', async () => {
		render( <EmailTimeSeriesWidget attributes={ {} } /> );

		await expect(
			screen.findByText( 'Open an email report to see its timeline here.' )
		).resolves.toBeInTheDocument();
		expect( mockApiFetch ).not.toHaveBeenCalled();
	} );

	it( 'shows the error state with a Retry action when the fetch fails', async () => {
		// A non-retryable 403 so React Query surfaces the error immediately
		// instead of after the retry backoff.
		mockApiFetch.mockRejectedValue( { status: 403, message: 'Forbidden' } );

		render(
			<EmailTimeSeriesWidget
				attributes={ {
					reportParams: { ...getDefaultQueryParams( false ), post_id: 1234 },
					metric: 'opens',
				} }
			/>
		);

		await expect(
			screen.findByText( /couldn't load this email's timeline/ )
		).resolves.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Retry' } ) ).toBeInTheDocument();
	} );
} );
