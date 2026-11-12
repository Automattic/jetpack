/**
 * Internal dependencies
 */
import { toDayWindow } from '../use-post-views';

describe( 'toDayWindow', () => {
	it( 'slices the date part off both ISO bounds', () => {
		expect(
			toDayWindow( '2026-07-01T00:00:00.000+08:00', '2026-07-07T23:59:59.999+08:00' )
		).toEqual( { from: '2026-07-01', to: '2026-07-07' } );
	} );

	it.each( [
		[ 'a missing from', undefined, '2026-07-07T23:59:59.999+08:00' ],
		[ 'a missing to', '2026-07-01T00:00:00.000+08:00', undefined ],
		[ 'an impossible day', '2026-02-31T00:00:00.000+08:00', '2026-07-07T23:59:59.999+08:00' ],
		[ 'an unparsable bound', '2026-07-01T00:00:00.000+08:00', 'not-a-date' ],
	] )( 'returns undefined for %s', ( _case, from, to ) => {
		expect( toDayWindow( from, to ) ).toBeUndefined();
	} );
} );
