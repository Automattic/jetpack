/**
 * Internal dependencies
 */
import { toPostId } from '../to-post-id';

describe( 'toPostId', () => {
	it.each( [
		[ 42, 42 ],
		[ '42', 42 ],
	] )( 'returns the positive integer represented by %j', ( value, expected ) => {
		expect( toPostId( value ) ).toBe( expected );
	} );

	it.each( [ undefined, '', 'not-a-number', '42px', 0, '0', -1, '-1', 1.5, '1.5', Infinity ] )(
		'returns 0 for invalid post ID %j',
		value => {
			expect( toPostId( value ) ).toBe( 0 );
		}
	);
} );
