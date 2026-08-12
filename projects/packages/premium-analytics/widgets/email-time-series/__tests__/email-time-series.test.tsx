/**
 * External dependencies
 */
import { getDefaultQueryParams, queryClient } from '@jetpack-premium-analytics/data';
import { render, screen } from '@testing-library/react';
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
			data-metric-count={ metrics.length }
			data-metric-label={ metrics[ 0 ]?.label }
			data-metric-total={ String( metrics[ 0 ]?.value ) }
			data-values={ metrics[ 0 ]?.current.map( point => point.value ).join( ',' ) }
			data-chart-type={ String( chartType ) }
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

		const chart = await screen.findByTestId( 'metric-tabs-chart' );
		expect( chart ).toHaveAttribute( 'data-metric-label', 'Total opens' );
		expect( chart ).toHaveAttribute( 'data-values', '10,5,7' );
		// The metric headline is the window total, and the chart type
		// defaults to line.
		expect( chart ).toHaveAttribute( 'data-metric-total', '22' );
		expect( chart ).toHaveAttribute( 'data-chart-type', 'line' );

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

		const chart = await screen.findByTestId( 'metric-tabs-chart' );
		expect( chart ).toHaveAttribute( 'data-metric-label', 'Total clicks' );
		expect( chart ).toHaveAttribute( 'data-values', '3' );

		const requestedPath = mockApiFetch.mock.calls[ 0 ][ 0 ].path as string;
		expect( requestedPath ).toContain( 'stats/clicks/emails/1234' );
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
						// Comparison params pass through the post detail URL untouched
						// (dashboard state survives the round trip), so a widget
						// receiving them must neither fetch a second window nor draw
						// an overlay — the page renders no comparison.
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

		// One request, scoped to the primary window only.
		const requestedDates = mockApiFetch.mock.calls.map( call =>
			new URLSearchParams( String( call[ 0 ].path ).split( '?' )[ 1 ] ).get( 'date' )
		);
		expect( requestedDates ).toEqual( [ '2026-07-01T00:00:00.000+08:00' ] );
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

		const chart = await screen.findByTestId( 'metric-tabs-chart' );
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
