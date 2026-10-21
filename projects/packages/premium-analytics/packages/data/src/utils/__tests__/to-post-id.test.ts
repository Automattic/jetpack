/**
 * Internal dependencies
 */
import { toAuthorId, toPostId } from '../to-post-id';

describe.each( [
	[ 'toPostId', toPostId ],
	[ 'toAuthorId', toAuthorId ],
] )( '%s', ( _name, toId ) => {
	it.each( [
		[ 42, 42 ],
		[ '42', 42 ],
	] )( 'returns the positive integer represented by %j', ( value, expected ) => {
		expect( toId( value ) ).toBe( expected );
	} );

	it.each( [ undefined, '', 'not-a-number', '42px', 0, '0', -1, '-1', 1.5, '1.5', Infinity ] )(
		'returns 0 for invalid ID %j',
		value => {
			expect( toId( value ) ).toBe( 0 );
		}
	);
} );
