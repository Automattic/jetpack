import { scaleBand } from '@visx/scale';
import { nearestBandIndex } from '../band-tooltip';

describe( 'nearestBandIndex', () => {
	test.each( [
		[ 25, 688 ],
		[ 688, 25 ],
	] )( 'matches every painted centre with outer padding in range %s to %s', ( start, end ) => {
		const data = Array.from( { length: 30 }, ( _, index ) => String( index ) );
		const scale = scaleBand( {
			domain: data,
			range: [ start, end ],
			paddingInner: 0.024,
			paddingOuter: 0.7,
		} );
		data.forEach( ( datum, index ) => {
			expect(
				nearestBandIndex( data, value => value, scale, scale( datum )! + scale.bandwidth() / 2 )
			).toBe( index );
		} );
	} );
	test( 'ignores data outside the band domain', () => {
		const scale = scaleBand( { domain: [ 'recorded' ], range: [ 0, 100 ] } );
		expect( nearestBandIndex( [ 'missing' ], value => value, scale, 50 ) ).toBe( -1 );
	} );
} );
