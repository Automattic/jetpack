/**
 * Internal dependencies
 */
import { isResponse } from '../is-response';

// Like a real `Response`, `status` is a prototype getter rather than an own property.
class FakeResponse {
	get status() {
		return 204;
	}

	json() {
		return Promise.resolve( null );
	}
}

describe( 'isResponse', () => {
	it( 'accepts a Response whose status lives on its prototype', () => {
		expect( isResponse( new FakeResponse() ) ).toBe( true );
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
		[ 'a parsed error body', { code: 'offline_error', message: 'Unable to connect.' } ],
		[ 'a status without json', { status: 200 } ],
		[ 'a non-numeric status', { status: '404', json: () => Promise.resolve( {} ) } ],
	] )( 'rejects %s', ( _label, value ) => {
		expect( isResponse( value ) ).toBe( false );
	} );
} );
