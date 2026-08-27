/**
 * External dependencies
 */
import { queryClient } from '@jetpack-premium-analytics/data';
import { fireEvent, render, screen } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import MostPopularTimeWidget from '../render';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

// WidgetRoot reads URL search params as a fallback for report params; outside
// a matched route the real hook warns and throws.
jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

const mockApiFetch = apiFetch as unknown as jest.Mock;

// `highest_day_of_week` is zero-based on Monday, so 6 is Sunday. Both labels are
// built from the site's locale tables, not from the raw numbers.
const INSIGHTS_RESPONSE = {
	highest_day_of_week: 6,
	highest_day_percent: 17.4,
	highest_hour: 19,
	highest_hour_percent: 5.2,
};

describe( 'MostPopularTimeWidget', () => {
	beforeEach( () => {
		// The data package's query client is a module-level singleton; drop its
		// cache so each test starts from a fresh fetch.
		queryClient.clear();
		mockApiFetch.mockReset();
		mockApiFetch.mockResolvedValue( INSIGHTS_RESPONSE );
	} );

	it( 'renders the peak day and hour with their share of views', async () => {
		const { container } = render( <MostPopularTimeWidget attributes={ {} } /> );

		await expect( screen.findByText( 'Sunday' ) ).resolves.toBeInTheDocument();

		// Label with value, so a highlight that renders the day's percent under
		// the hour — or vice versa — cannot pass.
		expect( container ).toHaveTextContent( 'Best daySunday17% of views' );
		expect( container ).toHaveTextContent( 'Best hour7 pm5% of views' );
	} );

	it( 'requests the insights endpoint without date params', async () => {
		render( <MostPopularTimeWidget attributes={ {} } /> );

		await expect( screen.findByText( 'Sunday' ) ).resolves.toBeInTheDocument();

		// The peak day and hour come from a fixed server-side window, so sending a
		// date range would imply a filter the endpoint does not apply.
		const [ [ request ] ] = mockApiFetch.mock.calls;
		const path = String( request.path );

		expect( path ).toContain( 'stats/insights' );
		// Params are serialized into the query string, so no query string at all
		// pins this more tightly than naming the params one at a time.
		expect( path ).not.toContain( '?' );
	} );

	it( 'reports no peak rather than midnight when the payload carries no hour', async () => {
		// A fabricated "12:00 AM" reads as a real answer; the card must not show
		// one just because the hour is missing.
		mockApiFetch.mockResolvedValue( {
			highest_day_of_week: 6,
			highest_day_percent: 17.4,
		} );

		render( <MostPopularTimeWidget attributes={ {} } /> );

		await expect(
			screen.findByText( 'Not enough data to determine your most popular time yet.' )
		).resolves.toBeInTheDocument();
		expect( screen.queryByText( 'Best hour' ) ).not.toBeInTheDocument();
	} );

	it( 'shows the empty state when the site has no peak yet', async () => {
		// The sanitizer drops the whole payload when `highest_day_of_week` is
		// missing, which is what a site with too little traffic returns.
		mockApiFetch.mockResolvedValue( {} );

		render( <MostPopularTimeWidget attributes={ {} } /> );

		await expect(
			screen.findByText( 'Not enough data to determine your most popular time yet.' )
		).resolves.toBeInTheDocument();
	} );

	it( 'keeps the rendered peak when a refetch fails', async () => {
		render( <MostPopularTimeWidget attributes={ {} } /> );

		await expect( screen.findByText( 'Sunday' ) ).resolves.toBeInTheDocument();

		// `placeholderData` keeps the prior response, so a transient failure must
		// not replace numbers that are still on screen with an error.
		mockApiFetch.mockRejectedValue( { status: 403, code: 'no_connection' } );
		queryClient.refetchQueries( { queryKey: [ 'stats', 'insights' ] } );

		await expect( screen.findByText( 'Sunday' ) ).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'Retry' } ) ).not.toBeInTheDocument();
	} );

	it( 'offers no retry to a reader without access', async () => {
		// A plain 403 is a permission failure: retrying cannot fix it, so the
		// shared error mapper states that neutrally and drops the action.
		mockApiFetch.mockRejectedValue( { status: 403, message: 'Forbidden' } );

		render( <MostPopularTimeWidget attributes={ {} } /> );

		await expect(
			screen.findByText( "You don't have access to this data." )
		).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'Retry' } ) ).not.toBeInTheDocument();
	} );

	it( 'shows the error state and refetches from the Retry action', async () => {
		// `no_connection` is the proxy's retryable 403 — it heals once the site
		// reconnects — and a 403 avoids React Query's retry backoff.
		mockApiFetch.mockRejectedValue( {
			status: 403,
			code: 'no_connection',
			message: 'Site is not connected.',
		} );

		render( <MostPopularTimeWidget attributes={ {} } /> );

		await expect(
			screen.findByText( "We couldn't load your most popular time. Please try again in a moment." )
		).resolves.toBeInTheDocument();

		// The highlights can only render from a successful refetch, since the
		// initial request rejected.
		mockApiFetch.mockResolvedValue( INSIGHTS_RESPONSE );
		fireEvent.click( screen.getByRole( 'button', { name: 'Retry' } ) ); // eslint-disable-line testing-library/prefer-user-event -- @testing-library/user-event is not a direct dep of this package.

		await expect( screen.findByText( 'Sunday' ) ).resolves.toBeInTheDocument();
	} );
} );
