import { getValueExtent, getNormalizedValue } from '../private/use-heatmap-colors';
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

describe( 'getNormalizedValue', () => {
	test( 'returns 0 at min and 1 at max', () => {
		expect( getNormalizedValue( 0, [ 0, 20 ] ) ).toBe( 0 );
		expect( getNormalizedValue( 20, [ 0, 20 ] ) ).toBe( 1 );
	} );

	test( 'returns a clamped value for points inside and outside the extent', () => {
		expect( getNormalizedValue( 10, [ 0, 20 ] ) ).toBe( 0.5 );
		expect( getNormalizedValue( 30, [ 0, 20 ] ) ).toBe( 1 );
		expect( getNormalizedValue( -5, [ 0, 20 ] ) ).toBe( 0 );
	} );

	test( 'returns 1 when min === max', () => {
		expect( getNormalizedValue( 7, [ 7, 7 ] ) ).toBe( 1 );
	} );
} );
