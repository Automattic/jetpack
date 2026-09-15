/**
 * External dependencies
 */
import { queryClient } from '@jetpack-premium-analytics/data';
import { render, screen } from '@testing-library/react';
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
	byDate?: Record< string, number >;
	failDates?: string[];
};

function respondWith( { total, byDate = {}, failDates = [] }: Responses ) {
	return ( { path }: { path: string } ) => {
		if ( path.includes( 'subscribers/counts' ) ) {
			return Promise.resolve( total === undefined ? {} : { counts: { total_subscribers: total } } );
		}

		const date = new URL( path, 'https://example.test' ).searchParams.get( 'date' ) ?? '';
		if ( failDates.includes( date ) ) {
			return Promise.reject( { status: 403, message: 'Forbidden' } );
		}

		return Promise.resolve( {
			date,
			unit: 'day',
			fields: [ 'period', 'subscribers', 'subscribers_paid' ],
			data: date in byDate ? [ [ date, byDate[ date ], 0 ] ] : [],
		} );
	};
}

function tileValues() {
	return screen.getAllByRole( 'listitem' ).map( tile => tile.textContent );
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

	it( 'shows the total next to the counts 30, 60 and 90 days ago', async () => {
		mockApiFetch.mockImplementation(
			respondWith( {
				total: 428,
				byDate: { '2026-08-16': 317, '2026-07-17': 186, '2026-06-17': 95 },
			} )
		);

		render( <SubscriberHighlightsWidget attributes={ {} } /> );

		await expect( screen.findByText( '428' ) ).resolves.toBeInTheDocument();
		expect( tileValues() ).toEqual( [
			'Total subscribers428',
			'30 days ago317',
			'60 days ago186',
			'90 days ago95',
		] );
	} );

	it( 'shows a placeholder for a day with no count, and a real zero as zero', async () => {
		mockApiFetch.mockImplementation(
			respondWith( { total: 428, byDate: { '2026-08-16': 317, '2026-06-17': 0 } } )
		);

		render( <SubscriberHighlightsWidget attributes={ {} } /> );

		await expect( screen.findByText( '317' ) ).resolves.toBeInTheDocument();
		expect( tileValues() ).toEqual( [
			'Total subscribers428',
			'30 days ago317',
			'60 days ago—',
			'90 days ago0',
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

	it( 'shows the WidgetState error with a Retry action when every request fails', async () => {
		mockApiFetch.mockRejectedValue( { status: 403, message: 'Forbidden' } );

		render( <SubscriberHighlightsWidget attributes={ {} } /> );

		await expect( screen.findByText( ERROR_TEXT ) ).resolves.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Retry' } ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Total subscribers' ) ).not.toBeInTheDocument();
	} );

	it( 'shows the WidgetState loading skeleton while the requests are pending', () => {
		mockApiFetch.mockReturnValue( new Promise( () => {} ) );

		render( <SubscriberHighlightsWidget attributes={ {} } /> );

		expect( screen.getByTestId( 'widget-skeleton' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Total subscribers' ) ).not.toBeInTheDocument();
		expect( screen.queryByText( ERROR_TEXT ) ).not.toBeInTheDocument();
	} );

	it( 'shows the WidgetState empty state when no request carries a count', async () => {
		mockApiFetch.mockImplementation( respondWith( {} ) );

		render( <SubscriberHighlightsWidget attributes={ {} } /> );

		await expect(
			screen.findByText( 'No subscriber counts available yet.' )
		).resolves.toBeInTheDocument();
		expect( screen.queryByText( 'Total subscribers' ) ).not.toBeInTheDocument();
	} );
} );
