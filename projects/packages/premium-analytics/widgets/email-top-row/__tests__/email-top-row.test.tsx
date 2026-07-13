/**
 * External dependencies
 */
import { getDefaultQueryParams, queryClient } from '@jetpack-premium-analytics/data';
import { fireEvent, render, screen } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import EmailTopRowWidget, { hasEmailMetrics, toEmailTopRowMetrics } from '../render';
import type { StatsEmailBreakdown } from '@jetpack-premium-analytics/data';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

jest.mock( '@wordpress/route', () => ( {
	useSearch: () => ( {} ),
} ) );

const mockApiFetch = apiFetch as unknown as jest.Mock;

// Raw per-post `rate` breakdown responses: flat scalars, one endpoint per view.
const OPENS_RATE_RESPONSE = {
	total_sends: 1000,
	total_opens: 400,
	unique_opens: 380,
	opens_rate: 38.1,
};

const CLICKS_RATE_RESPONSE = {
	total_sends: 1000,
	total_opens: 400,
	total_clicks: 40,
	clicks_rate: 3.81,
};

function routeRateResponse( options: unknown ) {
	const path = typeof options === 'string' ? options : ( options as { path?: string } )?.path ?? '';

	if ( path.includes( '/clicks/emails/' ) ) {
		return Promise.resolve( CLICKS_RATE_RESPONSE );
	}
	if ( path.includes( '/opens/emails/' ) ) {
		return Promise.resolve( OPENS_RATE_RESPONSE );
	}
	return Promise.resolve( {} );
}

// The summary type is index-signature only; tests build fixtures as plain objects.
const asSummary = ( fields: Record< string, number > ) =>
	fields as unknown as StatsEmailBreakdown[ 'summary' ];

describe( 'EmailTopRowWidget', () => {
	beforeEach( () => {
		queryClient.clear();
		mockApiFetch.mockReset();
		mockApiFetch.mockImplementation( routeRateResponse );
	} );

	it( 'renders the Opens view tiles from the per-post rate breakdown', async () => {
		render(
			<EmailTopRowWidget
				attributes={ {
					metric: 'opens',
					reportParams: { ...getDefaultQueryParams( false ), post_id: 2000 },
				} }
			/>
		);

		await expect( screen.findByText( 'Total emails sent' ) ).resolves.toBeInTheDocument();
		expect( screen.getByText( 'Unique opens' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Total opens' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Open rate' ) ).toBeInTheDocument();
		// Clicks-only tiles are not in the Opens view.
		expect( screen.queryByText( 'Click rate' ) ).not.toBeInTheDocument();
		// The open rate is formatted as a percentage from the 0–100 rate.
		expect( screen.getByText( '38.1%' ) ).toBeInTheDocument();
	} );

	it( 'renders the Clicks view tiles when metric is clicks', async () => {
		render(
			<EmailTopRowWidget
				attributes={ {
					metric: 'clicks',
					reportParams: { ...getDefaultQueryParams( false ), post_id: 2000 },
				} }
			/>
		);

		await expect( screen.findByText( 'Total clicks' ) ).resolves.toBeInTheDocument();
		expect( screen.getByText( 'Click rate' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Total opens' ) ).toBeInTheDocument();
		// Opens-only tiles are not in the Clicks view.
		expect( screen.queryByText( 'Unique opens' ) ).not.toBeInTheDocument();
	} );

	it( 'shows the empty state when the email has no stats', async () => {
		mockApiFetch.mockImplementation( () => Promise.resolve( {} ) );

		render(
			<EmailTopRowWidget
				attributes={ {
					metric: 'opens',
					reportParams: { ...getDefaultQueryParams( false ), post_id: 9999 },
				} }
			/>
		);

		await expect(
			screen.findByText( 'No stats are available for this email yet.' )
		).resolves.toBeInTheDocument();
	} );

	it( 'prompts to select an email when no post is selected', async () => {
		render(
			<EmailTopRowWidget
				attributes={ { metric: 'opens', reportParams: getDefaultQueryParams( false ) } }
			/>
		);

		await expect(
			screen.findByText( 'Select an email to see its stats.' )
		).resolves.toBeInTheDocument();
		// A disabled query must not fetch.
		expect( mockApiFetch ).not.toHaveBeenCalled();
	} );

	it( 'shows the error state and refetches from the Retry action', async () => {
		// Reject with a non-retryable (403) error so React Query surfaces the
		// error state immediately instead of retrying with backoff.
		mockApiFetch.mockRejectedValue( { status: 403, message: 'Forbidden' } );

		render(
			<EmailTopRowWidget
				attributes={ {
					metric: 'opens',
					reportParams: { ...getDefaultQueryParams( false ), post_id: 2000 },
				} }
			/>
		);

		await expect(
			screen.findByText( "We couldn't load this email's stats. Please try again in a moment." )
		).resolves.toBeInTheDocument();

		// Retry re-runs the query; the tiles can only render from a successful
		// refetch, since the initial request rejected.
		mockApiFetch.mockImplementation( routeRateResponse );
		fireEvent.click( screen.getByRole( 'button', { name: 'Retry' } ) ); // eslint-disable-line testing-library/prefer-user-event -- @testing-library/user-event is not a direct dep of this package.

		await expect( screen.findByText( 'Total emails sent' ) ).resolves.toBeInTheDocument();
	} );
} );

describe( 'toEmailTopRowMetrics', () => {
	it( 'builds the Opens view tiles in order and converts the 0–100 rate', () => {
		const metrics = toEmailTopRowMetrics(
			asSummary( { total_sends: 1000, total_opens: 400, unique_opens: 380, opens_rate: 38.1 } ),
			'opens'
		);

		expect( metrics.map( metric => metric.key ) ).toEqual( [
			'total_sends',
			'unique_opens',
			'total_opens',
			'opens_rate',
		] );
		expect( metrics.find( metric => metric.key === 'opens_rate' )?.value ).toBeCloseTo( 0.381 );
		expect( metrics.find( metric => metric.key === 'total_sends' )?.value ).toBe( 1000 );
	} );

	it( 'builds the Clicks view tiles in order', () => {
		const metrics = toEmailTopRowMetrics(
			asSummary( { total_opens: 400, total_clicks: 40, clicks_rate: 3.81 } ),
			'clicks'
		);

		expect( metrics.map( metric => metric.key ) ).toEqual( [
			'total_opens',
			'total_clicks',
			'clicks_rate',
		] );
		expect( metrics.find( metric => metric.key === 'clicks_rate' )?.value ).toBeCloseTo( 0.0381 );
	} );

	it( 'hides the Unique opens tile when there are no unique opens', () => {
		const metrics = toEmailTopRowMetrics(
			asSummary( { total_sends: 1000, total_opens: 400, unique_opens: 0, opens_rate: 38.1 } ),
			'opens'
		);

		expect( metrics.map( metric => metric.key ) ).not.toContain( 'unique_opens' );
	} );

	it( 'renders a missing or zero rate as null so the tile shows a placeholder', () => {
		const metrics = toEmailTopRowMetrics(
			asSummary( { total_sends: 1000, total_opens: 0, unique_opens: 0 } ),
			'opens'
		);

		expect( metrics.find( metric => metric.key === 'opens_rate' )?.value ).toBeNull();
	} );
} );

describe( 'hasEmailMetrics', () => {
	it( 'is false for an empty or missing summary', () => {
		expect( hasEmailMetrics( undefined ) ).toBe( false );
		expect( hasEmailMetrics( asSummary( {} ) ) ).toBe( false );
	} );

	it( 'is true when a metric field is present, including zero', () => {
		expect( hasEmailMetrics( asSummary( { total_sends: 0 } ) ) ).toBe( true );
		expect( hasEmailMetrics( asSummary( { total_opens: 400 } ) ) ).toBe( true );
	} );
} );
