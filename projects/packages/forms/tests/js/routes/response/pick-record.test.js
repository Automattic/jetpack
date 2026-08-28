/**
 * External dependencies
 */
import { describe, expect, it } from '@jest/globals';
/**
 * Internal dependencies
 */
import pickResponseRecord from '../../../../routes/response/pick-record.ts';

const record = id => ( { id, status: 'publish' } );

describe( 'pickResponseRecord', () => {
	it( 'prefers the page’s own record', () => {
		expect( pickResponseRecord( [ record( 2 ) ], [ record( 1 ), record( 2 ) ], 2 ) ).toEqual(
			record( 2 )
		);
	} );

	// The whole point of the fallback: the list the reader clicked from already has
	// the record, so the page renders immediately instead of waiting for its own
	// request under a cache key the list never populates.
	it( 'falls back to the list while the page’s own request is in flight', () => {
		expect( pickResponseRecord( null, [ record( 1 ), record( 2 ), record( 3 ) ], 2 ) ).toEqual(
			record( 2 )
		);
	} );

	it( 'falls back when the page’s query resolved empty', () => {
		expect( pickResponseRecord( [], [ record( 7 ) ], 7 ) ).toEqual( record( 7 ) );
	} );

	it( 'returns nothing when neither source has the response', () => {
		expect( pickResponseRecord( null, [ record( 1 ) ], 99 ) ).toBeUndefined();
		expect( pickResponseRecord( null, null, 1 ) ).toBeUndefined();
		expect( pickResponseRecord( undefined, undefined, 1 ) ).toBeUndefined();
	} );

	// A deep link lands with no list loaded at all.
	it( 'uses the page’s own record with no list present', () => {
		expect( pickResponseRecord( [ record( 5 ) ], null, 5 ) ).toEqual( record( 5 ) );
	} );

	it( 'matches on id rather than position', () => {
		expect( pickResponseRecord( null, [ record( 9 ), record( 4 ) ], 4 ) ).toEqual( record( 4 ) );
	} );
} );
