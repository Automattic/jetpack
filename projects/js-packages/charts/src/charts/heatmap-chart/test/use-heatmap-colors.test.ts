import { getValueExtent, isEmptyValue, scaleValues } from '../private/use-heatmap-colors';
import type { HeatmapColumn } from '../types';

const data: HeatmapColumn[] = [
	{ label: 'A', data: [ { value: 0 }, { value: null }, { value: 10 } ] },
	{ label: 'B', data: [ { value: 5 }, { value: 20 }, { value: null } ] },
];

describe( 'getValueExtent', () => {
	test( 'returns [min, max] ignoring null/NaN and empty zeros', () => {
		expect( getValueExtent( data ) ).toEqual( [ 5, 20 ] );
	} );

	test( 'keeps a zero in the extent when the data has negatives', () => {
		expect( getValueExtent( [ { data: [ { value: -4 }, { value: 0 } ] } ] ) ).toEqual( [ -4, 0 ] );
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
		expect( getValueExtent( [ { data: [ { value: 0 }, { value: 0 } ] } ] ) ).toEqual( [ 0, 0 ] );
	} );
} );

describe( 'scaleValues', () => {
	test( 'skips summary columns, partial cells and absent values, ascending', () => {
		const mixed: HeatmapColumn[] = [
			{ label: 'A', data: [ { value: 20 }, { value: null }, { value: 0 } ] },
			{ label: 'B', data: [ { value: 10 }, { value: 999, partial: true } ] },
			{ label: 'Total', summary: true, data: [ { value: 500 } ] },
			{ label: 'C', data: [ { value: 5 } ] },
		];

		expect( scaleValues( mixed ) ).toEqual( [ 0, 5, 10, 20 ] );
	} );
} );

describe( 'isEmptyValue', () => {
	test( 'paints a zero as empty in data with no negatives', () => {
		expect( isEmptyValue( 0, [ 0, 20 ] ) ).toBe( true );
		expect( isEmptyValue( 5, [ 0, 20 ] ) ).toBe( false );
	} );

	test( 'keeps a zero on the scale when the data has negatives', () => {
		expect( isEmptyValue( 0, [ -4, 6 ] ) ).toBe( false );
	} );
} );
