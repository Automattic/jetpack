import {
	contrastRatio,
	deltaE2000,
	hexToViews,
	oklchToHex,
	viewDistance,
} from '../private/perceptual-color';

describe( 'deltaE2000', () => {
	// Sharma, Wu and Dalal (2005) reference pairs.
	it.each( [
		[ [ 50, 2.6772, -79.7751 ], [ 50, 0, -82.7485 ], 2.0425 ],
		[ [ 50, 2.5, 0 ], [ 50, 0, -2.5 ], 4.3065 ],
		[ [ 50, 2.5, 0 ], [ 73, 25, -18 ], 27.1492 ],
		[ [ 2.0776, 0.0795, -1.135 ], [ 0.9033, -0.0636, -0.5514 ], 0.9082 ],
	] as const )( 'matches the reference value for %j vs %j', ( a, b, expected ) => {
		expect( deltaE2000( a, b ) ).toBeCloseTo( expected, 4 );
	} );

	it( 'is zero for identical colors', () => {
		expect( deltaE2000( [ 40, 10, -20 ], [ 40, 10, -20 ] ) ).toBe( 0 );
	} );
} );

describe( 'viewDistance', () => {
	it( 'collapses a red/green pair under color vision deficiency', () => {
		const red = hexToViews( '#cc4444' );
		const green = hexToViews( '#669900' );
		const [ normal ] = red.map( ( view, i ) => deltaE2000( view, green[ i ] ) );
		expect( normal ).toBeGreaterThan( 30 );
		expect( viewDistance( red, green ) ).toBeLessThan( 15 );
	} );

	it( 'keeps a blue/orange pair apart in every view', () => {
		expect( viewDistance( hexToViews( '#1f4bd0' ), hexToViews( '#dd823b' ) ) ).toBeGreaterThan(
			30
		);
	} );
} );

describe( 'oklchToHex', () => {
	it( 'converts an in-gamut color', () => {
		expect( oklchToHex( 0.627955, 0.257683, 29.2339 ) ).toBe( '#ff0000' );
	} );

	it( 'returns null outside the sRGB gamut', () => {
		expect( oklchToHex( 0.9, 0.3, 140 ) ).toBeNull();
	} );
} );

describe( 'contrastRatio', () => {
	it( 'is 21 for black on white, in either order', () => {
		expect( contrastRatio( '#000000', '#ffffff' ) ).toBeCloseTo( 21, 5 );
		expect( contrastRatio( '#ffffff', '#000000' ) ).toBeCloseTo( 21, 5 );
	} );

	it( 'is 1 for identical colors', () => {
		expect( contrastRatio( '#3858e9', '#3858e9' ) ).toBe( 1 );
	} );
} );
