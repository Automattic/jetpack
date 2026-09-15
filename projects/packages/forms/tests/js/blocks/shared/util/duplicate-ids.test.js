import { describe, expect, it } from '@jest/globals';
import {
	getDuplicateFieldIds,
	getRenamesForDuplicateIds,
} from '../../../../../src/blocks/shared/util/duplicate-ids.js';

describe( 'getDuplicateFieldIds', () => {
	it.each( [
		[ 'distinct ids', [ 'name', 'email', 'phone' ], [] ],
		[ 'an id claimed twice', [ 'first-name', 'first-name' ], [ 'first-name' ] ],
		[ 'an id claimed three times, once', [ 'name', 'name', 'name' ], [ 'name' ] ],
		[
			'each duplicated id separately',
			[ 'first-name', 'last-name', 'first-name', 'last-name' ],
			[ 'first-name', 'last-name' ],
		],
		// A suffixed id is a different id -- `name-2` does not collide with `name`.
		[ 'a suffixed id as distinct', [ 'name', 'name-2' ], [] ],
		// Fields with no id are not duplicates of one another: the dropdown keys those by
		// client id, so they stay individually selectable.
		[ 'missing ids as no collision', [ 'name', '', 'name', '' ], [ 'name' ] ],
		[ 'nothing for an empty form', [], [] ],
	] )( 'reports %s', ( _label, ids, expected ) => {
		expect( getDuplicateFieldIds( ids ) ).toEqual( new Set( expected ) );
	} );

	it( 'tolerates a missing list', () => {
		expect( getDuplicateFieldIds() ).toEqual( new Set() );
	} );
} );

describe( 'getRenamesForDuplicateIds', () => {
	const entries = ( ...ids ) => ids.map( ( id, i ) => ( { clientId: `c${ i }`, id } ) );

	// The first occurrence keeps the id, because that is the field the renderer already
	// resolves it to -- so anything already naming it goes on meaning the same field.
	it( 'keeps the first occurrence and suffixes the rest', () => {
		expect( getRenamesForDuplicateIds( entries( 'email', 'email' ), [ 'email' ] ) ).toEqual( [
			{ clientId: 'c1', id: 'email-2' },
		] );
	} );

	it( 'numbers each further duplicate in turn', () => {
		expect( getRenamesForDuplicateIds( entries( 'name', 'name', 'name' ), [ 'name' ] ) ).toEqual( [
			{ clientId: 'c1', id: 'name-2' },
			{ clientId: 'c2', id: 'name-3' },
		] );
	} );

	// A suffix another field already holds must not be handed out.
	it( 'skips a suffix that is taken', () => {
		expect( getRenamesForDuplicateIds( entries( 'name', 'name-2', 'name' ), [ 'name' ] ) ).toEqual(
			[ { clientId: 'c2', id: 'name-3' } ]
		);
	} );

	// Only the ids asked about: other collisions are left for their own repair.
	it( 'leaves other duplicated ids alone', () => {
		expect( getRenamesForDuplicateIds( entries( 'a', 'a', 'b', 'b' ), [ 'a' ] ) ).toEqual( [
			{ clientId: 'c1', id: 'a-2' },
		] );
	} );

	// Several collisions resolved in one pass, so a suffix handed out for one cannot land on
	// another -- and so the whole repair stays a single undo step.
	it( 'resolves several ids at once without colliding them', () => {
		expect(
			getRenamesForDuplicateIds( entries( 'a', 'a-2', 'a', 'b', 'b' ), [ 'a', 'b' ] )
		).toEqual( [
			{ clientId: 'c2', id: 'a-3' },
			{ clientId: 'c4', id: 'b-2' },
		] );
	} );

	it( 'renames nothing when there is nothing to rename', () => {
		expect( getRenamesForDuplicateIds( entries( 'a', 'b' ), [ 'a' ] ) ).toEqual( [] );
		expect( getRenamesForDuplicateIds( entries( 'a', 'b' ), [ 'zz' ] ) ).toEqual( [] );
		expect( getRenamesForDuplicateIds( entries( '', '' ), [ '' ] ) ).toEqual( [] );
		expect( getRenamesForDuplicateIds( entries( 'a', 'a' ), [] ) ).toEqual( [] );
		expect( getRenamesForDuplicateIds( undefined, [ 'a' ] ) ).toEqual( [] );
	} );
} );
