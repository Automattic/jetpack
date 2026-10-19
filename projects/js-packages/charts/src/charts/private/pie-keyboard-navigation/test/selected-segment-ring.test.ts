import { toSvgId } from '../selected-segment-ring';

describe( 'toSvgId', () => {
	it.each( [
		[ 'devices:1', 'devices/1' ],
		[ 'a_3a_', 'a:' ],
		[ ':r1:', '_r1_' ],
	] )( 'keeps %s and %s apart', ( first, second ) => {
		const ids = [ toSvgId( first ), toSvgId( second ) ];

		expect( ids[ 0 ] ).not.toBe( ids[ 1 ] );
		ids.forEach( id => expect( id ).toMatch( /^[A-Za-z0-9_-]+$/ ) );
	} );
} );
