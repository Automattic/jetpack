/**
 * External dependencies
 */
import { getDefaultQueryParams, queryClient } from '@jetpack-premium-analytics/data';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
	ComparativeLineChart: ( {
		series,
	}: {
		series: { label: string; data: { value: number }[] }[];
	} ) => (
		<div
			data-testid="comparative-line-chart"
			data-series-count={ series.length }
			data-series-label={ series[ 0 ]?.label }
			data-values={ series[ 0 ]?.data.map( point => point.value ).join( ',' ) }
			data-previous-values={ series[ 1 ]?.data.map( point => point.value ).join( ',' ) }
		/>
	),
} ) );

// WidgetRoot reads URL search params as a fallback for report params; outside
// a matched route the real hook warns and throws.
jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

const mockApiFetch = apiFetch as unknown as jest.Mock;

// Raw WPCOM email timeline shape (`stats_fields=timeline`): a matrix nested
// under `timeline`, one daily row per bucket. 2026-07-04/05 fall in one ISO
// week (Mon 2026-06-29) and 2026-07-06 opens the next, so weekly grouping
// collapses the three rows into two buckets (15 and 7).
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
					reportParams: { ...getDefaultQueryParams( false ), post_id: 1234 },
					metric: 'opens',
				} }
			/>
		);

		const chart = await screen.findByTestId( 'comparative-line-chart' );
		expect( chart ).toHaveAttribute( 'data-series-label', 'Total opens' );
		expect( chart ).toHaveAttribute( 'data-values', '10,5,7' );

		const requestedPath = mockApiFetch.mock.calls[ 0 ][ 0 ].path as string;
		expect( requestedPath ).toContain( 'stats/opens/emails/1234' );
		expect( requestedPath ).toContain( 'stats_fields=timeline' );
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
					reportParams: { ...getDefaultQueryParams( false ), post_id: 1234 },
					metric: 'clicks',
				} }
			/>
		);

		const chart = await screen.findByTestId( 'comparative-line-chart' );
		expect( chart ).toHaveAttribute( 'data-series-label', 'Total clicks' );
		expect( chart ).toHaveAttribute( 'data-values', '3' );

		const requestedPath = mockApiFetch.mock.calls[ 0 ][ 0 ].path as string;
		expect( requestedPath ).toContain( 'stats/clicks/emails/1234' );
	} );

	it( 'fetches the compare window and draws it as a second series when comparison is on', async () => {
		// Route by the window start: the primary window gets the real buckets,
		// the compare window gets a distinct set.
		mockApiFetch.mockImplementation( ( { path }: { path: string } ) =>
			Promise.resolve(
				path.includes( 'date=2026-07-01' )
					? OPENS_TIMELINE_RESPONSE
					: {
							timeline: {
								unit: 'day',
								fields: [ 'date', 'opens_count' ],
								data: [
									[ '2026-06-24', 2 ],
									[ '2026-06-25', 3 ],
									[ '2026-06-26', 4 ],
								],
							},
					  }
			)
		);

		render(
			<EmailTimeSeriesWidget
				attributes={ {
					reportParams: {
						...getDefaultQueryParams( false ),
						preset: undefined,
						from: '2026-07-01T00:00:00.000+08:00',
						to: '2026-07-07T23:59:59.999+08:00',
						comp: '1',
						compare_from: '2026-06-24T00:00:00.000+08:00',
						compare_to: '2026-06-30T23:59:59.999+08:00',
						post_id: 1234,
					},
					metric: 'opens',
				} }
			/>
		);

		const chart = await screen.findByTestId( 'comparative-line-chart' );
		await waitFor( () => expect( chart ).toHaveAttribute( 'data-series-count', '2' ) );
		expect( chart ).toHaveAttribute( 'data-values', '10,5,7' );
		expect( chart ).toHaveAttribute( 'data-previous-values', '2,3,4' );

		// One request per window, scoped by each window's start date.
		const requestedDates = mockApiFetch.mock.calls.map( call =>
			new URLSearchParams( String( call[ 0 ].path ).split( '?' )[ 1 ] ).get( 'date' )
		);
		expect( requestedDates ).toHaveLength( 2 );
		expect( requestedDates ).toEqual( expect.arrayContaining( [ '2026-07-01', '2026-06-24' ] ) );
	} );

	it( 'buckets the compare window relative to the primary layout across month boundaries', async () => {
		// Primary March window (one month bucket) vs a compare window crossing
		// January into February: the overlay must still be a single bucket.
		mockApiFetch.mockImplementation( ( { path }: { path: string } ) =>
			Promise.resolve(
				path.includes( 'date=2026-03-01' )
					? {
							timeline: {
								unit: 'day',
								fields: [ 'date', 'opens_count' ],
								data: [
									[ '2026-03-01', 4 ],
									[ '2026-03-31', 5 ],
								],
							},
					  }
					: {
							timeline: {
								unit: 'day',
								fields: [ 'date', 'opens_count' ],
								data: [
									[ '2026-01-29', 1 ],
									[ '2026-02-28', 2 ],
								],
							},
					  }
			)
		);

		render(
			<EmailTimeSeriesWidget
				attributes={ {
					reportParams: {
						...getDefaultQueryParams( false ),
						preset: undefined,
						from: '2026-03-01T00:00:00.000+08:00',
						to: '2026-03-31T23:59:59.999+08:00',
						comp: '1',
						compare_from: '2026-01-29T00:00:00.000+08:00',
						compare_to: '2026-02-28T23:59:59.999+08:00',
						post_id: 1234,
					},
					metric: 'opens',
					granularity: 'month',
				} }
			/>
		);

		const chart = await screen.findByTestId( 'comparative-line-chart' );
		await waitFor( () => expect( chart ).toHaveAttribute( 'data-series-count', '2' ) );
		expect( chart ).toHaveAttribute( 'data-values', '9' );
		expect( chart ).toHaveAttribute( 'data-previous-values', '3' );
	} );

	it( 'folds a longer compare window into the last bucket instead of dropping days', async () => {
		// previous-month can hand back more days than the primary (a 5-day
		// compare window onto a 2-day primary). The overlay must keep the same
		// two buckets as primary while summing all five compare days, not just
		// the two that pair by index.
		mockApiFetch.mockImplementation( ( { path }: { path: string } ) =>
			Promise.resolve(
				path.includes( 'date=2026-02-28' )
					? {
							timeline: {
								unit: 'day',
								fields: [ 'date', 'opens_count' ],
								data: [
									[ '2026-02-28', 10 ],
									[ '2026-03-01', 20 ],
								],
							},
					  }
					: {
							timeline: {
								unit: 'day',
								fields: [ 'date', 'opens_count' ],
								data: [
									[ '2026-01-28', 1 ],
									[ '2026-01-29', 2 ],
									[ '2026-01-30', 3 ],
									[ '2026-01-31', 4 ],
									[ '2026-02-01', 5 ],
								],
							},
					  }
			)
		);

		render(
			<EmailTimeSeriesWidget
				attributes={ {
					reportParams: {
						...getDefaultQueryParams( false ),
						preset: undefined,
						from: '2026-02-28T00:00:00.000+08:00',
						to: '2026-03-01T23:59:59.999+08:00',
						comp: '1',
						compare_from: '2026-01-28T00:00:00.000+08:00',
						compare_to: '2026-02-01T23:59:59.999+08:00',
						post_id: 1234,
					},
					metric: 'opens',
					granularity: 'month',
				} }
			/>
		);

		const chart = await screen.findByTestId( 'comparative-line-chart' );
		await waitFor( () => expect( chart ).toHaveAttribute( 'data-series-count', '2' ) );
		// Primary: Feb=10, Mar=20. Compare: Feb bucket = Jan 28 (1); Mar bucket =
		// the four remaining days (2+3+4+5 = 14) folded in, so nothing is lost.
		expect( chart ).toHaveAttribute( 'data-values', '10,20' );
		expect( chart ).toHaveAttribute( 'data-previous-values', '1,14' );
	} );

	it( 'surfaces the error state and retries both windows when the compare request fails', async () => {
		// Primary succeeds, comparison fails: the widget must not quietly show a
		// lone solid line, so the error state appears and Retry re-runs both.
		const compareStart = 'date=2026-06-24';
		mockApiFetch.mockImplementation( ( { path }: { path: string } ) =>
			path.includes( compareStart )
				? Promise.reject( { status: 403, message: 'Forbidden' } )
				: Promise.resolve( OPENS_TIMELINE_RESPONSE )
		);

		render(
			<EmailTimeSeriesWidget
				attributes={ {
					reportParams: {
						...getDefaultQueryParams( false ),
						preset: undefined,
						from: '2026-07-01T00:00:00.000+08:00',
						to: '2026-07-07T23:59:59.999+08:00',
						comp: '1',
						compare_from: '2026-06-24T00:00:00.000+08:00',
						compare_to: '2026-06-30T23:59:59.999+08:00',
						post_id: 1234,
					},
					metric: 'opens',
				} }
			/>
		);

		await expect(
			screen.findByText( /couldn't load this email's timeline/ )
		).resolves.toBeInTheDocument();

		// Retry re-runs both windows; once the compare window resolves, the
		// dashed overlay renders.
		mockApiFetch.mockImplementation( ( { path }: { path: string } ) =>
			Promise.resolve(
				path.includes( compareStart )
					? {
							timeline: {
								unit: 'day',
								fields: [ 'date', 'opens_count' ],
								data: [
									[ '2026-06-24', 2 ],
									[ '2026-06-25', 3 ],
									[ '2026-06-26', 4 ],
								],
							},
					  }
					: OPENS_TIMELINE_RESPONSE
			)
		);
		await userEvent.click( screen.getByRole( 'button', { name: 'Retry' } ) );

		const chart = await screen.findByTestId( 'comparative-line-chart' );
		await waitFor( () => expect( chart ).toHaveAttribute( 'data-series-count', '2' ) );
		expect( chart ).toHaveAttribute( 'data-previous-values', '2,3,4' );
	} );

	it( 'aggregates the daily buckets into ISO weeks for the weekly granularity', async () => {
		mockApiFetch.mockResolvedValue( OPENS_TIMELINE_RESPONSE );

		render(
			<EmailTimeSeriesWidget
				attributes={ {
					reportParams: { ...getDefaultQueryParams( false ), post_id: 1234 },
					metric: 'opens',
					granularity: 'week',
				} }
			/>
		);

		const chart = await screen.findByTestId( 'comparative-line-chart' );
		expect( chart ).toHaveAttribute( 'data-values', '15,7' );
	} );

	it( 'aggregates the daily buckets into calendar months for the monthly granularity', async () => {
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
					reportParams: { ...getDefaultQueryParams( false ), post_id: 1234 },
					metric: 'opens',
					granularity: 'month',
				} }
			/>
		);

		const chart = await screen.findByTestId( 'comparative-line-chart' );
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
		expect( screen.queryByTestId( 'comparative-line-chart' ) ).not.toBeInTheDocument();
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
