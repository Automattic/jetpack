/**
 * External dependencies
 */
import { getDefaultQueryParams, queryClient } from '@jetpack-premium-analytics/data';
import { act, render, screen, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { format, parseISO } from 'date-fns';
/**
 * Internal dependencies
 */
import PostingActivityWidget from '../render';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

jest.mock( '@wordpress/route', () => ( {
	useSearch: () => ( {} ),
} ) );

const mockApiFetch = apiFetch as unknown as jest.Mock;
const originalResizeObserver = globalThis.ResizeObserver;
const resizeCallbacks: ResizeObserverCallback[] = [];

function resizeWidget( width: number, height: number ) {
	act( () => {
		resizeCallbacks.forEach( callback => {
			callback(
				[
					{
						contentRect: { width, height },
					} as ResizeObserverEntry,
				],
				{} as ResizeObserver
			);
		} );
	} );
}

function addUtcDays( dateString: string, dayCount: number ) {
	const date = new Date( `${ dateString }T00:00:00Z` );
	date.setUTCDate( date.getUTCDate() + dayCount );
	return date.toISOString().slice( 0, 10 );
}

function toUtcTimestamp( dateString: string ) {
	const [ year, month, day ] = dateString.split( '-' ).map( Number );
	return Date.UTC( year, month - 1, day ) / 1000;
}

function getExpectedRange() {
	const reportParams = getDefaultQueryParams();
	const endDate = reportParams.to.split( 'T' )[ 0 ];

	return {
		startDate: addUtcDays( endDate, -364 ),
		endDate,
	};
}

describe( 'PostingActivityWidget', () => {
	beforeEach( () => {
		const { endDate } = getExpectedRange();
		const activeDate = addUtcDays( endDate, -14 );

		queryClient.clear();
		resizeCallbacks.length = 0;
		globalThis.ResizeObserver = class {
			constructor( callback: ResizeObserverCallback ) {
				resizeCallbacks.push( callback );
			}
			observe = jest.fn();
			disconnect = jest.fn();
			unobserve = jest.fn();
		} as unknown as typeof ResizeObserver;
		mockApiFetch.mockReset();
		mockApiFetch.mockResolvedValue( {
			data: {
				[ String( toUtcTimestamp( activeDate ) ) ]: 3,
			},
		} );
	} );

	afterAll( () => {
		globalThis.ResizeObserver = originalResizeObserver;
	} );

	it( 'queries a trailing year and renders a compact range that fits the widget width', async () => {
		const { startDate, endDate } = getExpectedRange();
		const activeDate = addUtcDays( endDate, -14 );
		const activeDateLabel = `${ format( parseISO( activeDate ), 'EEE, MMM d, yyyy' ) }: 3`;

		render( <PostingActivityWidget attributes={ {} } /> );

		await waitFor( () => expect( resizeCallbacks.length ).toBeGreaterThan( 0 ) );
		resizeWidget( 95, 200 );

		const grid = await screen.findByRole( 'grid', { name: 'Heatmap chart' } );
		expect( grid ).toHaveAttribute( 'aria-colcount', '5' );
		expect( screen.getAllByTestId( 'heatmap-cell' ) ).toHaveLength( 35 );
		expect( mockApiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( {
				path: expect.stringContaining( `startDate=${ startDate }` ),
			} )
		);
		expect( mockApiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( {
				path: expect.stringContaining( `endDate=${ endDate }` ),
			} )
		);
		expect( screen.getByLabelText( activeDateLabel ) ).toBeInTheDocument();
	} );

	it( 'uses the default heatmap when the widget is tall enough', async () => {
		render( <PostingActivityWidget attributes={ {} } /> );

		await waitFor( () => expect( resizeCallbacks.length ).toBeGreaterThan( 0 ) );
		resizeWidget( 875, 360 );

		const grid = await screen.findByRole( 'grid', { name: 'Heatmap chart' } );
		await waitFor( () => expect( grid ).toHaveAttribute( 'aria-colcount', '24' ) );
		expect( screen.getAllByTestId( 'heatmap-cell' ) ).toHaveLength( 168 );
		expect( grid.style.gridTemplateColumns ).toContain( 'minmax(0, 1fr)' );
		expect( screen.getByTestId( 'responsive-wrapper' ) ).toHaveStyle( {
			aspectRatio: '2.5',
		} );
		expect( screen.getByTestId( 'responsive-wrapper' ) ).toHaveStyle( { maxWidth: '' } );
	} );
} );
