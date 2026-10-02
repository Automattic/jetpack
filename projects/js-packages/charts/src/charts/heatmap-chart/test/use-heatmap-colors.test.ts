import { getValueExtent, getNormalizedValue, isEmptyValue } from '../private/use-heatmap-colors';
import type { HeatmapColumn } from '../types';

const data: HeatmapColumn[] = [
	{ label: 'A', data: [ { value: 0 }, { value: null }, { value: 10 } ] },
	{ label: 'B', data: [ { value: 5 }, { value: 20 }, { value: null } ] },
];

describe( 'getValueExtent', () => {
	test( 'returns [min, max] ignoring null/NaN, and zeros in non-negative data', () => {
		expect( getValueExtent( data ) ).toEqual( [ 5, 20 ] );
	} );

	test( 'keeps zeros on the scale when the data has negatives', () => {
		expect( getValueExtent( [ { data: [ { value: -4 }, { value: 0 }, { value: 6 } ] } ] ) ).toEqual(
			[ -4, 6 ]
		);
	} );

	test( 'returns [0, 0] for all-zero data', () => {
		expect( getValueExtent( [ { data: [ { value: 0 }, { value: 0 } ] } ] ) ).toEqual( [ 0, 0 ] );
	} );

	test( 'leaves summary columns out of the extent', () => {
		const withTotals: HeatmapColumn[] = [
			...data,
			{ label: 'Total', summary: true, data: [ { value: 500 }, { value: 900 }, { value: null } ] },
		];
		expect( getValueExtent( withTotals ) ).toEqual( [ 5, 20 ] );
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

	test( 'returns 0 for an all-zero extent so a no-activity grid stays at the scale bottom', () => {
		expect( getNormalizedValue( 0, [ 0, 0 ] ) ).toBe( 0 );
	} );
} );

describe( 'isEmptyValue', () => {
	test( 'paints a zero as empty in non-negative data', () => {
		expect( isEmptyValue( 0, [ 5, 20 ] ) ).toBe( true );
		expect( isEmptyValue( 0, [ 0, 0 ] ) ).toBe( true );
		expect( isEmptyValue( 5, [ 5, 20 ] ) ).toBe( false );
	} );

	test( 'keeps a zero on the scale when the data has negatives', () => {
		expect( isEmptyValue( 0, [ -4, 6 ] ) ).toBe( false );
	} );
} );
