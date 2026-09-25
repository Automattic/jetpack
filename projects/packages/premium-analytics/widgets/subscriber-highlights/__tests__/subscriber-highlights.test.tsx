/**
 * External dependencies
 */
import { queryClient } from '@jetpack-premium-analytics/data';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import SubscriberHighlightsWidget from '../render';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

// WidgetRoot reads URL search params as a fallback for report params; outside
// a matched route the real hook warns and throws.
jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

const mockApiFetch = apiFetch as unknown as jest.Mock;

const ERROR_TEXT = "We couldn't load subscriber highlights. Please try again in a moment.";

type Responses = {
	total?: number;
	paid?: number;
	social?: number;
	failCounts?: boolean;
	byDate?: Record< string, number | null >;
	paidByDate?: Record< string, number | null >;
	failDates?: string[];
};

function respondWith( {
	total,
	paid,
	social,
	failCounts = false,
	byDate = {},
	paidByDate = {},
	failDates = [],
}: Responses ) {
	return ( { path }: { path: string } ) => {
		if ( failCounts && path.includes( 'subscribers/counts' ) ) {
			return Promise.reject( { status: 403, message: 'Forbidden' } );
		}

		if ( path.includes( 'subscribers/counts' ) ) {
			return Promise.resolve(
				total === undefined
					? {}
					: {
							counts: {
								total_subscribers: total,
								paid_subscribers: paid,
								social_followers: social,
							},
						}
			);
		}

		const date = new URL( path, 'https://example.test' ).searchParams.get( 'date' ) ?? '';
		if ( failDates.includes( date ) ) {
			return Promise.reject( { status: 403, message: 'Forbidden' } );
		}

		return Promise.resolve( {
			date,
			unit: 'day',
			fields: [ 'period', 'subscribers', 'subscribers_paid' ],
			data:
				date in byDate
					? [ [ date, byDate[ date ], date in paidByDate ? paidByDate[ date ] : 0 ] ]
					: [],
		} );
	};
}

function tileValues() {
	return screen.getAllByRole( 'listitem' ).map( item => item.textContent );
}

function tile( label: string ) {
	const match = screen
		.getAllByRole( 'listitem' )
		.find( item => item.textContent?.startsWith( label ) );
	if ( ! match ) {
		throw new Error( `No tile labelled ${ label }` );
	}
	return match;
}

function requestedSeriesDates() {
	return mockApiFetch.mock.calls
		.map( call => call[ 0 ].path as string )
		.filter( path => path.includes( 'stats/subscribers' ) )
		.map( path => new URL( path, 'https://example.test' ).searchParams.get( 'date' ) );
}

describe( 'SubscriberHighlightsWidget', () => {
	beforeEach( () => {
		queryClient.clear();
		mockApiFetch.mockReset();
		jest.useFakeTimers( { now: new Date( '2026-09-15T12:00:00Z' ), advanceTimers: true } );
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	it( 'shows the total next to the counts 30, 60 and 90 days ago when nobody pays', async () => {
		mockApiFetch.mockImplementation(
			respondWith( {
				total: 428,
				paid: 0,
				byDate: { '2026-08-16': 317, '2026-07-17': 186, '2026-06-17': 95 },
			} )
		);

		render( <SubscriberHighlightsWidget attributes={ {} } /> );

		await expect( screen.findByText( '428' ) ).resolves.toBeInTheDocument();
		expect( tileValues() ).toEqual( [
			expect.stringMatching( /^All-time subscribers.*428$/ ),
			expect.stringMatching( /^30 days ago.*317$/ ),
			expect.stringMatching( /^60 days ago.*186$/ ),
			expect.stringMatching( /^90 days ago.*95$/ ),
		] );
	} );

	it( 'shows social followers alongside the history when nobody pays', async () => {
		mockApiFetch.mockImplementation(
			respondWith( {
				total: 428,
				paid: 0,
				social: 64,
				byDate: { '2026-08-16': 317, '2026-07-17': 186, '2026-06-17': 95 },
			} )
		);

		render( <SubscriberHighlightsWidget attributes={ {} } /> );

		await expect( screen.findByText( '428' ) ).resolves.toBeInTheDocument();
		expect( tileValues() ).toEqual( [
			expect.stringMatching( /^All-time subscribers.*428$/ ),
			expect.stringMatching( /^30 days ago.*317$/ ),
			expect.stringMatching( /^60 days ago.*186$/ ),
			expect.stringMatching( /^90 days ago.*95$/ ),
			expect.stringMatching( /^Social followers.*64$/ ),
		] );
	} );

	it( 'describes every history tile and the social tile with a note', async () => {
		mockApiFetch.mockImplementation(
			respondWith( {
				total: 428,
				paid: 0,
				social: 64,
				byDate: { '2026-08-16': 317, '2026-07-17': 186, '2026-06-17': 95 },
			} )
		);

		render( <SubscriberHighlightsWidget attributes={ {} } /> );

		await expect( screen.findByText( '428' ) ).resolves.toBeInTheDocument();
		for ( const note of [
			'Total subscribers excluding social media subscribers',
			'Total subscribers 30 days ago, excluding social media subscribers',
			'Total subscribers 60 days ago, excluding social media subscribers',
			'Total subscribers 90 days ago, excluding social media subscribers',
			'Social media subscribers, not included in All-time subscribers',
		] ) {
			expect( screen.getByText( note ) ).toBeInTheDocument();
			expect( screen.getByTitle( note ) ).toBeInTheDocument();
		}
	} );

	it( 'describes every tile with a note when the site has paid subscribers', async () => {
		mockApiFetch.mockImplementation( respondWith( { total: 428, paid: 117, social: 64 } ) );

		render( <SubscriberHighlightsWidget attributes={ {} } /> );

		await expect( screen.findByText( '428' ) ).resolves.toBeInTheDocument();
		for ( const note of [
			'Total subscribers excluding social media subscribers',
			'Paid WordPress.com subscribers',
			'Email subscribers and free WordPress.com subscribers',
			'Social media subscribers, not included in All-time subscribers',
		] ) {
			expect( screen.getByText( note ) ).toBeInTheDocument();
			expect( screen.getByTitle( note ) ).toBeInTheDocument();
		}
	} );

	it( 'hides the social tile rather than showing zero', async () => {
		mockApiFetch.mockImplementation(
			respondWith( { total: 428, paid: 117, social: 0, byDate: { '2026-08-16': 317 } } )
		);

		render( <SubscriberHighlightsWidget attributes={ {} } /> );

		await expect( screen.findByText( '428' ) ).resolves.toBeInTheDocument();
		expect( screen.queryByText( 'Social followers' ) ).not.toBeInTheDocument();
	} );

	it( 'shows paid, free and social instead of the history when the site has paid subscribers', async () => {
		mockApiFetch.mockImplementation( respondWith( { total: 428, paid: 117, social: 64 } ) );

		render( <SubscriberHighlightsWidget attributes={ {} } /> );

		await expect( screen.findByText( '428' ) ).resolves.toBeInTheDocument();
		expect( tileValues() ).toEqual( [
			expect.stringMatching( /^All-time subscribers.*428$/ ),
			expect.stringMatching( /^Paid subscribers.*117$/ ),
			expect.stringMatching( /^Free subscribers.*311$/ ),
			expect.stringMatching( /^Social followers.*64$/ ),
		] );
		expect( requestedSeriesDates() ).toEqual( [ '2026-08-16' ] );
	} );

	it( 'shows each count with its change since 30 days ago when the site has paid subscribers', async () => {
		mockApiFetch.mockImplementation(
			respondWith( {
				total: 428,
				paid: 117,
				byDate: { '2026-08-16': 400 },
				paidByDate: { '2026-08-16': 100 },
			} )
		);

		render( <SubscriberHighlightsWidget attributes={ {} } /> );

		await expect( screen.findByText( '+7%' ) ).resolves.toBeInTheDocument();
		expect( within( tile( 'All-time subscribers' ) ).getByText( '428' ) ).toBeInTheDocument();
		expect( within( tile( 'All-time subscribers' ) ).getByText( '+7%' ) ).toBeInTheDocument();
		expect( within( tile( 'Paid subscribers' ) ).getByText( '117' ) ).toBeInTheDocument();
		expect( within( tile( 'Paid subscribers' ) ).getByText( '+17%' ) ).toBeInTheDocument();
		expect( within( tile( 'Free subscribers' ) ).getByText( '311' ) ).toBeInTheDocument();
		expect( within( tile( 'Free subscribers' ) ).getByText( '+4%' ) ).toBeInTheDocument();
		expect(
			within( tile( 'Paid subscribers' ) ).getByText(
				'Paid WordPress.com subscribers. The change is since 30 days ago.'
			)
		).toBeInTheDocument();
	} );

	it( 'shows the counts before the 30-day change arrives', async () => {
		mockApiFetch.mockImplementation( ( request: { path: string } ) =>
			request.path.includes( 'stats/subscribers' )
				? new Promise( () => {} )
				: respondWith( { total: 428, paid: 117 } )( request )
		);

		render( <SubscriberHighlightsWidget attributes={ {} } /> );

		await expect( screen.findByText( '428' ) ).resolves.toBeInTheDocument();
		expect( screen.queryByTestId( 'widget-skeleton' ) ).not.toBeInTheDocument();
	} );

	it( 'shows no change on a tile with no count 30 days ago', async () => {
		mockApiFetch.mockImplementation(
			respondWith( {
				total: 428,
				paid: 117,
				byDate: { '2026-08-16': 400 },
				paidByDate: { '2026-08-16': null },
			} )
		);

		render( <SubscriberHighlightsWidget attributes={ {} } /> );

		await expect( screen.findByText( '+7%' ) ).resolves.toBeInTheDocument();
		expect( within( tile( 'Paid subscribers' ) ).queryByText( /%$/ ) ).not.toBeInTheDocument();
		expect( within( tile( 'Free subscribers' ) ).queryByText( /%$/ ) ).not.toBeInTheDocument();
		expect(
			within( tile( 'Paid subscribers' ) ).getByText( 'Paid WordPress.com subscribers' )
		).toBeInTheDocument();
	} );

	it( 'shows no change on a tile that was zero 30 days ago', async () => {
		mockApiFetch.mockImplementation(
			respondWith( {
				total: 428,
				paid: 117,
				byDate: { '2026-08-16': 400 },
				paidByDate: { '2026-08-16': 0 },
			} )
		);

		render( <SubscriberHighlightsWidget attributes={ {} } /> );

		await expect( screen.findByText( '+7%' ) ).resolves.toBeInTheDocument();
		expect( within( tile( 'Paid subscribers' ) ).queryByText( '—' ) ).not.toBeInTheDocument();
		expect( within( tile( 'Paid subscribers' ) ).queryByText( /%$/ ) ).not.toBeInTheDocument();
	} );

	it( 'keeps the counts rather than the error when the 30-day request fails', async () => {
		mockApiFetch.mockImplementation(
			respondWith( { total: 428, paid: 117, failDates: [ '2026-08-16' ] } )
		);

		render( <SubscriberHighlightsWidget attributes={ {} } /> );

		await expect( screen.findByText( '428' ) ).resolves.toBeInTheDocument();
		expect( screen.queryByText( ERROR_TEXT ) ).not.toBeInTheDocument();
		expect( screen.queryByText( /%$/ ) ).not.toBeInTheDocument();
	} );

	it( 'asks for the 30-day count again when Retry recovers the counts on a paid site', async () => {
		mockApiFetch.mockImplementation( respondWith( { failCounts: true } ) );

		render( <SubscriberHighlightsWidget attributes={ {} } /> );

		const retry = await screen.findByRole( 'button', { name: 'Retry' } );
		mockApiFetch.mockClear();
		mockApiFetch.mockImplementation(
			respondWith( {
				total: 428,
				paid: 117,
				byDate: { '2026-08-16': 400 },
				paidByDate: { '2026-08-16': 100 },
			} )
		);
		await userEvent.setup( { advanceTimers: jest.advanceTimersByTime } ).click( retry );

		await expect( screen.findByText( '+7%' ) ).resolves.toBeInTheDocument();
	} );

	it( 'shows the error instead of guessing the tiles when the counts request fails', async () => {
		mockApiFetch.mockImplementation(
			respondWith( { failCounts: true, byDate: { '2026-08-16': 317 } } )
		);

		render( <SubscriberHighlightsWidget attributes={ {} } /> );

		await expect( screen.findByText( ERROR_TEXT ) ).resolves.toBeInTheDocument();
		const requestedPaths = mockApiFetch.mock.calls.map( call => call[ 0 ].path as string );
		expect( requestedPaths.some( path => path.includes( 'stats/subscribers' ) ) ).toBe( false );
	} );

	it( 'retries the history when every day failed', async () => {
		const failDates = [ '2026-08-16', '2026-07-17', '2026-06-17' ];
		mockApiFetch.mockImplementation( respondWith( { failDates } ) );

		render( <SubscriberHighlightsWidget attributes={ {} } /> );

		const retry = await screen.findByRole( 'button', { name: 'Retry' } );
		mockApiFetch.mockClear();
		mockApiFetch.mockImplementation( respondWith( { byDate: { '2026-08-16': 317 } } ) );
		await userEvent.setup( { advanceTimers: jest.advanceTimersByTime } ).click( retry );

		await expect( screen.findByText( '317' ) ).resolves.toBeInTheDocument();
	} );

	it( 'never shows fewer than zero free subscribers', async () => {
		// 100 - 117 is -17, which no clamped value ends in, so dropping the clamp fails here.
		mockApiFetch.mockImplementation( respondWith( { total: 100, paid: 117, social: 5 } ) );

		render( <SubscriberHighlightsWidget attributes={ {} } /> );

		await expect( screen.findByText( '117' ) ).resolves.toBeInTheDocument();
		expect( tileValues() ).toContainEqual( expect.stringMatching( /^Free subscribers.*0$/ ) );
	} );

	it( 'shows a placeholder for a day before the site existed, which the endpoint reports as null', async () => {
		mockApiFetch.mockImplementation(
			respondWith( {
				total: 428,
				byDate: { '2026-08-16': 317, '2026-07-17': null, '2026-06-17': null },
			} )
		);

		render( <SubscriberHighlightsWidget attributes={ {} } /> );

		await expect( screen.findByText( '317' ) ).resolves.toBeInTheDocument();
		expect( tileValues() ).toEqual( [
			expect.stringMatching( /^All-time subscribers.*428$/ ),
			expect.stringMatching( /^30 days ago.*317$/ ),
			expect.stringMatching( /^60 days ago.*—$/ ),
			expect.stringMatching( /^90 days ago.*—$/ ),
		] );
	} );

	it( 'shows a placeholder for a day with no count, and a real zero as zero', async () => {
		mockApiFetch.mockImplementation(
			respondWith( { total: 428, byDate: { '2026-08-16': 317, '2026-06-17': 0 } } )
		);

		render( <SubscriberHighlightsWidget attributes={ {} } /> );

		await expect( screen.findByText( '317' ) ).resolves.toBeInTheDocument();
		expect( tileValues() ).toEqual( [
			expect.stringMatching( /^All-time subscribers.*428$/ ),
			expect.stringMatching( /^30 days ago.*317$/ ),
			expect.stringMatching( /^60 days ago.*—$/ ),
			expect.stringMatching( /^90 days ago.*0$/ ),
		] );
	} );

	it( 'keeps the tiles that loaded when one day fails', async () => {
		mockApiFetch.mockImplementation(
			respondWith( { total: 428, byDate: { '2026-08-16': 317 }, failDates: [ '2026-07-17' ] } )
		);

		render( <SubscriberHighlightsWidget attributes={ {} } /> );

		await expect( screen.findByText( '428' ) ).resolves.toBeInTheDocument();
		expect( screen.queryByText( ERROR_TEXT ) ).not.toBeInTheDocument();
	} );

	it( 'shows the error rather than dashes when the counts load and every day fails', async () => {
		mockApiFetch.mockImplementation(
			respondWith( { total: 428, failDates: [ '2026-08-16', '2026-07-17', '2026-06-17' ] } )
		);

		render( <SubscriberHighlightsWidget attributes={ {} } /> );

		await expect( screen.findByText( ERROR_TEXT ) ).resolves.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Retry' } ) ).toBeInTheDocument();
		expect( screen.queryByText( '428' ) ).not.toBeInTheDocument();
	} );

	it( 'shows the WidgetState error with a Retry action when every request fails', async () => {
		mockApiFetch.mockRejectedValue( { status: 403, message: 'Forbidden' } );

		render( <SubscriberHighlightsWidget attributes={ {} } /> );

		await expect( screen.findByText( ERROR_TEXT ) ).resolves.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Retry' } ) ).toBeInTheDocument();
		expect( screen.queryByText( 'All-time subscribers' ) ).not.toBeInTheDocument();
	} );

	it( 'requests every endpoint again when Retry is pressed', async () => {
		mockApiFetch.mockRejectedValue( { status: 403, message: 'Forbidden' } );

		render( <SubscriberHighlightsWidget attributes={ {} } /> );

		const retry = await screen.findByRole( 'button', { name: 'Retry' } );
		mockApiFetch.mockClear();
		mockApiFetch.mockImplementation( respondWith( { total: 428, byDate: { '2026-08-16': 317 } } ) );
		await userEvent.setup( { advanceTimers: jest.advanceTimersByTime } ).click( retry );

		await expect( screen.findByText( '317' ) ).resolves.toBeInTheDocument();
		const requestedPaths = mockApiFetch.mock.calls.map( call => call[ 0 ].path as string );
		expect( requestedPaths.some( path => path.includes( 'subscribers/counts' ) ) ).toBe( true );
		expect( requestedPaths.some( path => path.includes( 'stats/subscribers' ) ) ).toBe( true );
	} );

	it( 'shows the WidgetState loading skeleton while the requests are pending', () => {
		mockApiFetch.mockReturnValue( new Promise( () => {} ) );

		render( <SubscriberHighlightsWidget attributes={ {} } /> );

		expect( screen.getByTestId( 'widget-skeleton' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'All-time subscribers' ) ).not.toBeInTheDocument();
		expect( screen.queryByText( ERROR_TEXT ) ).not.toBeInTheDocument();
	} );

	it( 'shows the WidgetState empty state when no request carries a count', async () => {
		mockApiFetch.mockImplementation( respondWith( {} ) );

		render( <SubscriberHighlightsWidget attributes={ {} } /> );

		await expect(
			screen.findByText( 'No subscriber counts available yet.' )
		).resolves.toBeInTheDocument();
		expect( screen.queryByText( 'All-time subscribers' ) ).not.toBeInTheDocument();
	} );
} );
