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
	ComparativeLineChart: ( {
		series,
	}: {
		series: { label: string; data: { value: number }[] }[];
	} ) => (
		<div
			data-testid="comparative-line-chart"
			data-series-label={ series[ 0 ]?.label }
			data-values={ series[ 0 ]?.data.map( point => point.value ).join( ',' ) }
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
					[ '2026-07-05', 5 ],
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
