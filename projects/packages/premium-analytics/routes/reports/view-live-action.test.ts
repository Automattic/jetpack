/**
 * Internal dependencies
 */
import { createViewLiveAction } from './view-live-action';

type Row = { url?: string };

const action = createViewLiveAction< Row >( row => row.url );

describe( 'createViewLiveAction', () => {
	it.each( [
		[ 'with a URL', { url: 'https://example.com/hello/' }, true ],
		[ 'without one', {}, false ],
	] )( 'offers the action to a row %s: %s', ( _, row, eligible ) => {
		expect( action.isEligible?.( row ) ).toBe( eligible );
	} );

	it( 'opens the URL in a new tab that cannot reach the dashboard', () => {
		const open = jest.spyOn( window, 'open' ).mockImplementation( () => null );

		if ( ! ( 'callback' in action ) ) {
			throw new Error( 'Expected a button action.' );
		}

		action.callback( [ { url: 'https://example.com/hello/' } ], { registry: undefined } );

		expect( open ).toHaveBeenCalledWith(
			'https://example.com/hello/',
			'_blank',
			'noopener,noreferrer'
		);
		open.mockRestore();
	} );
} );
