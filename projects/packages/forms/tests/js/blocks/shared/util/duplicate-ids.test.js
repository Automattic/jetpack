import { describe, expect, it } from '@jest/globals';
import { getDuplicateFieldIds } from '../../../../../src/blocks/shared/util/duplicate-ids.js';

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
