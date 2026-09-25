/**
 * External dependencies
 */
import { queryClient } from '@jetpack-premium-analytics/data';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { getSettings, setSettings } from '@wordpress/date';
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

/** Whatever `@wordpress/date` ships, captured before a test installs settings. */
const DEFAULT_DATE_SETTINGS = getSettings();

/**
 * A Spanish site on a 24-hour clock. Only the fields the two labels read are
 * varied; the rest is inherited, so the fixture cannot drift from the package's
 * own defaults. The locale name is unique because `setSettings` skips
 * redefining one it already knows.
 */
const ES_ES_SETTINGS = {
	...DEFAULT_DATE_SETTINGS,
	l10n: {
		...DEFAULT_DATE_SETTINGS.l10n,
		locale: 'es_ES_most_popular_time_test',
		weekdays: [ 'domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado' ],
	},
	formats: { ...DEFAULT_DATE_SETTINGS.formats, time: 'H:i' },
};

describe( 'MostPopularTimeWidget', () => {
	beforeEach( () => {
		// The data package's query client is a module-level singleton; drop its
		// cache so each test starts from a fresh fetch.
		queryClient.clear();
		mockApiFetch.mockReset();
		mockApiFetch.mockResolvedValue( INSIGHTS_RESPONSE );
		// Settings are global, so restore them for the tests that read the
		// English labels after the locale test has installed a Spanish site.
		setSettings( DEFAULT_DATE_SETTINGS );
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

	it( 'labels the peak in the site locale and time format', async () => {
		// Same payload on a Spanish site with a 24-hour clock: a hardcoded English
		// weekday table or a fixed 12-hour clock passes every other assertion here,
		// so this is what covers the wiring into the shared formatters.
		setSettings( ES_ES_SETTINGS );

		const { container } = render( <MostPopularTimeWidget attributes={ {} } /> );

		await expect( screen.findByText( 'domingo' ) ).resolves.toBeInTheDocument();
		expect( container ).toHaveTextContent( 'Best hour19' );
		expect( container ).not.toHaveTextContent( 'Sunday' );
	} );

	it( 'keeps the known best day when the payload carries no hour', async () => {
		// A fabricated "12:00 AM" reads as a real answer, but so does hiding a day
		// the endpoint did send — drop only the highlight that has no data.
		mockApiFetch.mockResolvedValue( {
			highest_day_of_week: 6,
			highest_day_percent: 17.4,
		} );

		const { container } = render( <MostPopularTimeWidget attributes={ {} } /> );

		await expect( screen.findByText( 'Sunday' ) ).resolves.toBeInTheDocument();
		expect( container ).toHaveTextContent( 'Best daySunday17% of views' );
		expect( screen.queryByText( 'Best hour' ) ).not.toBeInTheDocument();
	} );

	it( 'drops the share caption rather than captioning a peak with 0%', async () => {
		mockApiFetch.mockResolvedValue( { highest_day_of_week: 6, highest_hour: 19 } );

		render( <MostPopularTimeWidget attributes={ {} } /> );

		await expect( screen.findByText( 'Sunday' ) ).resolves.toBeInTheDocument();
		expect( screen.queryByText( /of views/ ) ).not.toBeInTheDocument();
	} );

	it( 'shows the empty state when the site has no peak yet', async () => {
		// A site with too little traffic returns no `highest_day_of_week`, and the
		// card stands on the day — so that alone is what makes it empty. The
		// sanitizer keeps the rest of the report for the widgets that share it.
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
		// not replace numbers that are still on screen with an error. Awaited on
		// the refetch itself: "Sunday" is already mounted, so asserting it without
		// waiting would pass before the rejection could land.
		mockApiFetch.mockRejectedValue( { status: 403, code: 'no_connection' } );
		await queryClient.refetchQueries( { queryKey: [ 'stats', 'insights' ] } );
		await waitFor( () => expect( mockApiFetch ).toHaveBeenCalledTimes( 2 ) );

		expect( screen.getByText( 'Sunday' ) ).toBeInTheDocument();
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
