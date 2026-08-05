/**
 * One case builds a real WHATWG `Response`, which the shared jsdom environment
 * provides no constructor for.
 *
 * @jest-environment node
 */

/**
 * Internal dependencies
 */
import { isResponse } from '../is-response';

describe( 'isResponse', () => {
	it( 'accepts a real Response', () => {
		expect( isResponse( new Response( null, { status: 204 } ) ) ).toBe( true );
	} );

	it( 'accepts a cross-realm lookalike', () => {
		// The reason this is a shape check: a `Response` from another realm (or a
		// duck-typed test double, as in `report-export-fetch.test.ts`) fails
		// `instanceof` but must still route to the error-parsing branch.
		expect( isResponse( { status: 502, json: () => Promise.resolve( {} ) } ) ).toBe( true );
	} );

	it.each( [
		[ 'null', null ],
		[ 'undefined', undefined ],
		[ 'an array', [ 'boom' ] ],
		[ 'a parsed error body', { code: 'offline_error', message: 'Unable to connect.' } ],
		[ 'a status without json', { status: 200 } ],
		[ 'a json without status', { json: () => Promise.resolve( {} ) } ],
		[ 'a non-numeric status', { status: '404', json: () => Promise.resolve( {} ) } ],
	] )( 'rejects %s', ( _label, value ) => {
		expect( isResponse( value ) ).toBe( false );
	} );
} );
