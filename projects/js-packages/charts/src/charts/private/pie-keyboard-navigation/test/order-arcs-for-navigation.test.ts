import { orderArcsForNavigation } from '../order-arcs-for-navigation';

const half = Math.PI / 2;

describe( 'orderArcsForNavigation', () => {
	it.each( [
		[
			'full pie, clockwise from 12 o’clock',
			[
				{ id: 'b', startAngle: Math.PI, endAngle: 2 * Math.PI },
				{ id: 'a', startAngle: 0, endAngle: Math.PI },
			],
			[ 'a', 'b' ],
		],
		[
			'clockwise semi-circle, left to right',
			[
				{ id: 'right', startAngle: 0, endAngle: half },
				{ id: 'left', startAngle: -half, endAngle: 0 },
			],
			[ 'left', 'right' ],
		],
		[
			'counter-clockwise semi-circle, left to right',
			[
				{ id: 'right', startAngle: half, endAngle: 0 },
				{ id: 'left', startAngle: 0, endAngle: -half },
			],
			[ 'left', 'right' ],
		],
	] )( 'orders a %s', ( _, arcs, expected ) => {
		expect( orderArcsForNavigation( arcs ).map( arc => arc.id ) ).toEqual( expected );
	} );
} );
