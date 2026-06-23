import {
	getValueExtent,
	createColorScale,
	getNormalizedValue,
} from '../private/use-heatmap-colors';
import type { HeatmapColumn } from '../types';

const data: HeatmapColumn[] = [
	{ label: 'A', data: [ { value: 0 }, { value: null }, { value: 10 } ] },
	{ label: 'B', data: [ { value: 5 }, { value: 20 }, { value: null } ] },
];

describe( 'getValueExtent', () => {
	test( 'returns [min, max] ignoring null/NaN', () => {
		expect( getValueExtent( data ) ).toEqual( [ 0, 20 ] );
	} );

	test( 'returns [0, 0] for all-empty data', () => {
		expect( getValueExtent( [ { data: [ { value: null } ] } ] ) ).toEqual( [ 0, 0 ] );
	} );
} );

describe( 'createColorScale', () => {
	test( 'maps min to the light color and max to the full color', () => {
		const scale = createColorScale( [ 0, 20 ], '#cce4ef', '#006dab' );
		expect( scale( 0 ).toLowerCase() ).toBe( '#cce4ef' );
		expect( scale( 20 ).toLowerCase() ).toBe( '#006dab' );
	} );

	test( 'interpolates a between value', () => {
		const scale = createColorScale( [ 0, 20 ], '#ffffff', '#000000' );
		// midpoint should be a grey, not white or black
		expect( scale( 10 ).toLowerCase() ).not.toBe( '#ffffff' );
		expect( scale( 10 ).toLowerCase() ).not.toBe( '#000000' );
	} );

	test( 'returns the full color when min === max', () => {
		const scale = createColorScale( [ 7, 7 ], '#cce4ef', '#006dab' );
		expect( scale( 7 ).toLowerCase() ).toBe( '#006dab' );
	} );

	test( 'returns a hex string for an interpolated value', () => {
		const scale = createColorScale( [ 0, 20 ], '#ffffff', '#000000' );
		expect( scale( 10 ).toLowerCase() ).toMatch( /^#[0-9a-f]{6}$/ );
	} );
} );

describe( 'getNormalizedValue', () => {
	test( 'returns 0 at min and 1 at max', () => {
		expect( getNormalizedValue( 0, [ 0, 20 ] ) ).toBe( 0 );
		expect( getNormalizedValue( 20, [ 0, 20 ] ) ).toBe( 1 );
	} );

	test( 'returns 1 when min === max', () => {
		expect( getNormalizedValue( 7, [ 7, 7 ] ) ).toBe( 1 );
	} );
} );
