/**
 * External dependencies
 */
import { getDefaultQueryParams, queryClient } from '@jetpack-premium-analytics/data';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import MostPopularDayWidget from '../render';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

// WidgetRoot reads URL search params as a fallback for report params; outside
// a matched route the real hook warns and throws.
jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

const mockApiFetch = apiFetch as unknown as jest.Mock;

// `views_best_day` is a site-local calendar day, and `views` is the all-time
// total the best day's share is taken against — here 0.16% of it.
const SITE_SUMMARY_RESPONSE = {
	stats: {
		views: 64144375,
		views_best_day: '2011-10-17',
		views_best_day_total: 102631,
	},
};

describe( 'MostPopularDayWidget', () => {
	beforeEach( () => {
		// The data package's query client is a module-level singleton; drop its
		// cache so each test starts from a fresh fetch.
		queryClient.clear();
		mockApiFetch.mockReset();
		mockApiFetch.mockResolvedValue( SITE_SUMMARY_RESPONSE );
	} );

	it( 'renders the best day and its views with their captions', async () => {
		const { container } = render( <MostPopularDayWidget attributes={ {} } /> );

		await expect( screen.findByText( 'October 17' ) ).resolves.toBeInTheDocument();

		// Label with value and caption, so a field that renders the year under the
		// view count — or vice versa — cannot pass.
		expect( container ).toHaveTextContent( 'DayOctober 172011' );
		// The labels carry the card's structure, so they are headings under the
		// widget title the host renders.
		expect( screen.getByRole( 'heading', { level: 4, name: 'Day' } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'heading', { level: 4, name: 'Views' } ) ).toBeInTheDocument();
		// The count appears twice by design: the abbreviated headline is hidden
		// from assistive tech, and the exact count beside it is hidden visually.
		expect( container ).toHaveTextContent( 'Views102.6K102,6310.16% of views' );
		expect( screen.getByText( '102.6K' ) ).toHaveAttribute( 'aria-hidden', 'true' );
	} );

	it( 'requests the site summary without date params', async () => {
		render( <MostPopularDayWidget attributes={ {} } /> );

		await expect( screen.findByText( 'October 17' ) ).resolves.toBeInTheDocument();

		// The best day is all-time, so sending a date range would imply a filter
		// the endpoint does not apply.
		const [ [ request ] ] = mockApiFetch.mock.calls;
		const path = String( request.path );

		expect( path ).toContain( 'proxy/v1.1/stats' );
		// Params are serialized into the query string, so no query string at all
		// pins this more tightly than naming the params one at a time.
		expect( path ).not.toContain( '?' );
	} );

	it( 'ignores the report params the host injects', async () => {
		// The card is all-time, so host report params must reach WidgetRoot (the
		// contract) and still leave both the request and the figures untouched.
		render(
			<MostPopularDayWidget attributes={ { reportParams: getDefaultQueryParams( true ) } } />
		);

		await expect( screen.findByText( 'October 17' ) ).resolves.toBeInTheDocument();

		const [ [ request ] ] = mockApiFetch.mock.calls;

		expect( String( request.path ) ).not.toContain( '?' );
	} );

	it( 'drops the share caption rather than captioning the best day with 0%', async () => {
		// A summary with no all-time total to divide by: "0% of views" would read
		// as a measurement rather than a missing one.
		mockApiFetch.mockResolvedValue( {
			stats: { views_best_day: '2011-10-17', views_best_day_total: 102631 },
		} );

		const { container } = render( <MostPopularDayWidget attributes={ {} } /> );

		await expect( screen.findByText( 'October 17' ) ).resolves.toBeInTheDocument();

		expect( container ).toHaveTextContent( 'Views102.6K' );
		expect( screen.queryByText( /of views/ ) ).not.toBeInTheDocument();
	} );

	it( 'renders a count below the first multiplier whole', async () => {
		// `decimals: 1` alone renders 110 views as "110.0", which reads as a
		// measurement to one decimal rather than a count of 110.
		mockApiFetch.mockResolvedValue( {
			stats: { views: 732, views_best_day: '2011-10-17', views_best_day_total: 110 },
		} );

		const { container } = render( <MostPopularDayWidget attributes={ {} } /> );

		await expect( screen.findByText( 'October 17' ) ).resolves.toBeInTheDocument();

		// Nothing to abbreviate, so the count is rendered once and read as it
		// stands — no hidden duplicate the way the compacted headline needs.
		expect( container ).toHaveTextContent( 'Views11015.03% of views' );
	} );

	it( 'shows the empty state when the site has no best day yet', async () => {
		mockApiFetch.mockResolvedValue( { stats: { views: 0 } } );

		render( <MostPopularDayWidget attributes={ {} } /> );

		await expect(
			screen.findByText( 'Not enough views yet to pick a most popular day.' )
		).resolves.toBeInTheDocument();
	} );

	it( 'shows the empty state for a best day that drew no views', async () => {
		// A day named with a zero total is the same "not enough views yet" case;
		// rendering "Views 0" would present it as a measurement.
		mockApiFetch.mockResolvedValue( {
			stats: { views: 0, views_best_day: '2011-10-17', views_best_day_total: 0 },
		} );

		render( <MostPopularDayWidget attributes={ {} } /> );

		await expect(
			screen.findByText( 'Not enough views yet to pick a most popular day.' )
		).resolves.toBeInTheDocument();
		expect( screen.queryByText( 'October 17' ) ).not.toBeInTheDocument();
	} );

	it( 'keeps the rendered day when a refetch fails', async () => {
		render( <MostPopularDayWidget attributes={ {} } /> );

		await expect( screen.findByText( 'October 17' ) ).resolves.toBeInTheDocument();

		// `placeholderData` keeps the prior response, so a transient failure must not
		// replace figures still on screen. Awaited on the refetch itself: "October 17"
		// is already mounted, so asserting it would pass before the rejection lands.
		mockApiFetch.mockRejectedValue( { status: 403, code: 'no_connection' } );
		await queryClient.refetchQueries( { queryKey: [ 'stats', 'site' ] } );
		await waitFor( () => expect( mockApiFetch ).toHaveBeenCalledTimes( 2 ) );

		expect( screen.getByText( 'October 17' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'Retry' } ) ).not.toBeInTheDocument();
	} );

	it( 'offers no retry to a reader without access', async () => {
		// A plain 403 is a permission failure: retrying cannot fix it, so the
		// shared error mapper states that neutrally and drops the action.
		mockApiFetch.mockRejectedValue( { status: 403, message: 'Forbidden' } );

		render( <MostPopularDayWidget attributes={ {} } /> );

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

		render( <MostPopularDayWidget attributes={ {} } /> );

		await expect(
			screen.findByText( "We couldn't load your most popular day. Please try again in a moment." )
		).resolves.toBeInTheDocument();

		// The highlight can only render from a successful refetch, since the
		// initial request rejected.
		mockApiFetch.mockResolvedValue( SITE_SUMMARY_RESPONSE );
		fireEvent.click( screen.getByRole( 'button', { name: 'Retry' } ) ); // eslint-disable-line testing-library/prefer-user-event -- @testing-library/user-event is not a direct dep of this package.

		await expect( screen.findByText( 'October 17' ) ).resolves.toBeInTheDocument();
	} );
} );
