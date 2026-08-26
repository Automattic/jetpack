import { describe, expect, it } from '@jest/globals';
import { getDuplicateFieldIds } from '../../../../../src/blocks/shared/conditional-logic/util/duplicate-ids.js';

const fields = ( ...ids ) => ids.map( ( id, i ) => ( { clientId: `c${ i }`, id } ) );

describe( 'getDuplicateFieldIds', () => {
	it( 'finds nothing when every id is distinct', () => {
		expect( getDuplicateFieldIds( fields( 'name', 'email', 'phone' ) ) ).toEqual( new Set() );
	} );

	it( 'reports an id claimed twice', () => {
		expect( getDuplicateFieldIds( fields( 'first-name', 'first-name' ) ) ).toEqual(
			new Set( [ 'first-name' ] )
		);
	} );

	it( 'reports an id claimed three times once', () => {
		expect( getDuplicateFieldIds( fields( 'name', 'name', 'name' ) ) ).toEqual(
			new Set( [ 'name' ] )
		);
	} );

	it( 'reports each duplicated id separately', () => {
		expect(
			getDuplicateFieldIds( fields( 'first-name', 'last-name', 'first-name', 'last-name' ) )
		).toEqual( new Set( [ 'first-name', 'last-name' ] ) );
	} );

	// Fields with no id are not duplicates of one another: the dropdown keys those by client
	// id, so they stay individually selectable, and choosing one assigns it an id then.
	it( 'does not treat missing ids as a collision', () => {
		expect( getDuplicateFieldIds( fields( '', '', '' ) ) ).toEqual( new Set() );
	} );

	it( 'ignores missing ids alongside a real duplicate', () => {
		expect( getDuplicateFieldIds( fields( 'name', '', 'name', '' ) ) ).toEqual(
			new Set( [ 'name' ] )
		);
	} );

	// A suffixed id is a different id -- `name-2` does not collide with `name`.
	it( 'treats a suffixed id as distinct', () => {
		expect( getDuplicateFieldIds( fields( 'name', 'name-2' ) ) ).toEqual( new Set() );
	} );

	it( 'tolerates a missing or malformed list', () => {
		expect( getDuplicateFieldIds( undefined ) ).toEqual( new Set() );
		expect( getDuplicateFieldIds( [] ) ).toEqual( new Set() );
		expect( getDuplicateFieldIds( [ null, undefined, {} ] ) ).toEqual( new Set() );
	} );
} );
