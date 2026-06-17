import { computeComparisonRect, getValueScaleBaseline } from '../comparison-bars-geometry';

describe( 'getValueScaleBaseline', () => {
	it( 'clamps to the bottom (range max) when 0 is below the domain (vertical, descending range)', () => {
		// vertical linear scale: range [200, 0] (bottom -> top), domain [10, 100] (zero excluded)
		const scale = ( ( v: number ) => 200 - ( ( v - 10 ) / 90 ) * 200 ) as never;
		( scale as { range: () => number[] } ).range = () => [ 200, 0 ];
		// scale(0) = 200 - (-10/90)*200 ≈ 222 -> clamped to 200
		expect( getValueScaleBaseline( scale ) ).toBe( 200 );
	} );

	it( 'clamps to the end (range max) when 0 is outside an ascending range scale', () => {
		// horizontal linear scale: range [0, 200], domain [-100, -10] (zero excluded)
		const scale = ( ( v: number ) => ( ( v + 100 ) / 90 ) * 200 ) as never;
		( scale as { range: () => number[] } ).range = () => [ 0, 200 ];
		// scale(0) = (100/90)*200 ≈ 222 -> clamped to 200
		expect( getValueScaleBaseline( scale ) ).toBe( 200 );
	} );
} );

describe( 'computeComparisonRect', () => {
	const base = {
		bandPosition: 100,
		slotOffset: 10,
		slotThickness: 40,
		valuePosition: 50,
		baseline: 200,
		widthFactor: 1.5,
	};

	it( 'centers a 150% wide shadow on the primary slot (vertical)', () => {
		const r = computeComparisonRect( { ...base, horizontal: false } );
		// slotStart=110, center=110+20=130, shadowThickness=60, shadowStart=130-30=100
		expect( r ).toEqual( { x: 100, y: 50, width: 60, height: 150 } );
	} );

	it( 'centers a 150% tall shadow on the primary slot (horizontal)', () => {
		const r = computeComparisonRect( {
			...base,
			horizontal: true,
			valuePosition: 150,
			baseline: 0,
		} );
		// slotStart=110, center=130, shadowThickness=60, shadowStart=100
		expect( r ).toEqual( { x: 0, y: 100, width: 150, height: 60 } );
	} );
} );
