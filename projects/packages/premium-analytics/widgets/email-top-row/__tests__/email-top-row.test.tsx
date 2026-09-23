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
import emailTopRowWidgetType from '../widget';
import type { StatsEmailBreakdown } from '@jetpack-premium-analytics/data';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

const mockApiFetch = apiFetch as unknown as jest.Mock;

// Raw per-post `rate` responses, shaped as wpcom's Email_Opens_Rate_Stats and
// Email_Clicks_Rate_Stats return them.
const OPENS_RATE_RESPONSE = {
	total_sends: 1000,
	unique_opens: 381,
	total_opens: 400,
	opens_rate: 0.381,
};

const CLICKS_RATE_RESPONSE = {
	total_clicks: 40,
	unique_clicks: 38,
	total_sends: 1000,
	total_opens: 400,
	clicks_rate: 0.038,
};

// A legacy send: sends went unrecorded, so the opens endpoint nulls everything and
// only the clicks endpoint carries the opens.
const LEGACY_OPENS_RATE_RESPONSE = {
	total_sends: null,
	unique_opens: null,
	total_opens: null,
	opens_rate: null,
};

const LEGACY_CLICKS_RATE_RESPONSE = {
	total_clicks: 5,
	unique_clicks: 0,
	total_sends: 0,
	total_opens: 120,
	clicks_rate: null,
};

let rateResponses = {
	opens: OPENS_RATE_RESPONSE as object,
	clicks: CLICKS_RATE_RESPONSE as object,
};

function routeRateResponse( options: unknown ) {
	const path =
		typeof options === 'string' ? options : ( ( options as { path?: string } )?.path ?? '' );

	if ( path.includes( '/clicks/emails/' ) ) {
		return Promise.resolve( rateResponses.clicks );
	}
	if ( path.includes( '/opens/emails/' ) ) {
		return Promise.resolve( rateResponses.opens );
	}
	return Promise.resolve( {} );
}

// The summary type is index-signature only; tests build fixtures as plain objects.
const asSummary = ( fields: Record< string, number | null > ) =>
	fields as unknown as StatsEmailBreakdown[ 'summary' ];

describe( 'EmailTopRowWidget', () => {
	beforeEach( () => {
		queryClient.clear();
		rateResponses = { opens: OPENS_RATE_RESPONSE, clicks: CLICKS_RATE_RESPONSE };
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

		await expect( screen.findByText( 'Emails sent' ) ).resolves.toBeInTheDocument();
		expect( screen.getByText( 'Unique opens' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Total opens' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Open rate' ) ).toBeInTheDocument();
		// Clicks-only tiles are not in the Opens view.
		expect( screen.queryByText( 'Click rate' ) ).not.toBeInTheDocument();
		// The open rate is formatted as a percentage from the 0–1 rate fraction.
		expect( screen.getByText( '38.1%' ) ).toBeInTheDocument();
	} );

	it( "shows a legacy send's opens from the clicks endpoint instead of an empty state", async () => {
		rateResponses = { opens: LEGACY_OPENS_RATE_RESPONSE, clicks: LEGACY_CLICKS_RATE_RESPONSE };

		render(
			<EmailTopRowWidget
				attributes={ {
					metric: 'opens',
					reportParams: { ...getDefaultQueryParams( false ), post_id: 2000 },
				} }
			/>
		);

		await expect( screen.findByText( '120' ) ).resolves.toBeInTheDocument();
		expect( screen.queryByText( 'Unique opens' ) ).not.toBeInTheDocument();
		// Emails sent and Open rate are unknown, not zero.
		expect( screen.getAllByText( '—' ) ).toHaveLength( 2 );
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

		await expect( screen.findByText( 'Total opens' ) ).resolves.toBeInTheDocument();
		expect( screen.getByText( 'Total clicks' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Click rate' ) ).toBeInTheDocument();
		// Opens-only tiles are not in the Clicks view.
		expect( screen.queryByText( 'Emails sent' ) ).not.toBeInTheDocument();
		expect( screen.queryByText( 'Unique opens' ) ).not.toBeInTheDocument();

		// Both views read both rate summaries.
		const requestedPaths = mockApiFetch.mock.calls.map( call => call[ 0 ].path as string );
		expect( requestedPaths.some( path => path.includes( 'stats/opens/emails/2000/rate' ) ) ).toBe(
			true
		);
		expect( requestedPaths.some( path => path.includes( 'stats/clicks/emails/2000/rate' ) ) ).toBe(
			true
		);
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

		await expect( screen.findByText( 'Emails sent' ) ).resolves.toBeInTheDocument();
	} );
} );

describe( 'toEmailTopRowMetrics', () => {
	it( 'builds the Opens view tiles in order and preserves the 0–1 rate fraction', () => {
		const metrics = toEmailTopRowMetrics(
			asSummary( { total_sends: 1000, total_opens: 400, unique_opens: 380, opens_rate: 0.381 } ),
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
			asSummary( {
				total_sends: 1000,
				unique_opens: 380,
				total_opens: 400,
				total_clicks: 40,
				unique_clicks: 38,
				clicks_rate: 0.0381,
			} ),
			'clicks'
		);

		expect( metrics.map( metric => metric.key ) ).toEqual( [
			'total_opens',
			'total_clicks',
			'clicks_rate',
		] );
		expect( metrics.find( metric => metric.key === 'clicks_rate' )?.value ).toBeCloseTo( 0.0381 );
	} );

	it( 'shows a real 0% and zero unique opens for a sent, unopened email', () => {
		const metrics = toEmailTopRowMetrics(
			asSummary( { total_sends: 1, unique_opens: 0, total_opens: 0, opens_rate: 0 } ),
			'opens'
		);

		expect( Object.fromEntries( metrics.map( metric => [ metric.key, metric.value ] ) ) ).toEqual( {
			total_sends: 1,
			unique_opens: 0,
			total_opens: 0,
			opens_rate: 0,
		} );
	} );

	it( 'hides Unique opens and the rate when opens have no attributable recipient', () => {
		const metrics = toEmailTopRowMetrics(
			asSummary( { total_sends: 1000, unique_opens: 0, total_opens: 400, opens_rate: 0 } ),
			'opens'
		);

		expect( metrics.map( metric => metric.key ) ).not.toContain( 'unique_opens' );
		expect( metrics.find( metric => metric.key === 'opens_rate' )?.value ).toBeNull();
	} );

	it( 'shows unrecorded sends and their rate as unknown, not zero', () => {
		const metrics = toEmailTopRowMetrics(
			asSummary( { total_clicks: 5, unique_clicks: 0, total_sends: 0, total_opens: 120 } ),
			'opens'
		);

		expect( Object.fromEntries( metrics.map( metric => [ metric.key, metric.value ] ) ) ).toEqual( {
			total_sends: null,
			total_opens: 120,
			opens_rate: null,
		} );
	} );

	it( 'shows a real 0% click rate and a missing total as unknown', () => {
		const metrics = toEmailTopRowMetrics(
			asSummary( { total_clicks: 0, unique_clicks: 0, total_sends: 1, clicks_rate: 0 } ),
			'clicks'
		);

		expect( Object.fromEntries( metrics.map( metric => [ metric.key, metric.value ] ) ) ).toEqual( {
			total_opens: null,
			total_clicks: 0,
			clicks_rate: 0,
		} );
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

describe( 'EmailTopRow widget type', () => {
	it( 'declares no drawer-only attribute, so the host renders no settings button', () => {
		// Mirrors the host's predicate: the settings button appears as soon as any
		// attribute is not exposed inline (`relevance: 'high'`).
		expect(
			emailTopRowWidgetType.attributes.every( attribute => attribute.relevance === 'high' )
		).toBe( true );
	} );
} );
