import { createScale } from '@visx/scale';
import {
	getTickDecimals,
	getTickDecimalsDomain,
	getTickDecimalValues,
	hasOnlyWholeNumbers,
} from '../tick-decimals';
import type { SeriesData } from '../../../types';

const linear = ( domain: [ number, number ] ) =>
	createScale( { type: 'linear', domain, range: [ 100, 0 ] } );

const series = ( ...values: Array< number | null > ): SeriesData => ( {
	label: 'A',
	data: values.map( ( value, i ) => ( { date: new Date( 2024, i, 1 ), value } ) ),
} );

describe( 'getTickDecimalValues', () => {
	it( 'keeps only the whole ticks of a range smaller than the tick count', () => {
		expect( getTickDecimalValues( linear( [ 0, 1 ] ), 4 ) ).toEqual( [ 0, 1 ] );
		expect( getTickDecimalValues( linear( [ 0, 2 ] ), 4 ) ).toEqual( [ 0, 1, 2 ] );
	} );

	it( 'leaves a scale whose ticks are already whole to visx', () => {
		expect( getTickDecimalValues( linear( [ 0, 1000 ] ), 4 ) ).toBeUndefined();
	} );

	it( 'leaves non-numeric scales to visx', () => {
		const band = createScale( { type: 'band', domain: [ 'a', 'b' ], range: [ 0, 100 ] } );
		const time = createScale( {
			type: 'time',
			domain: [ new Date( 2024, 0, 1 ), new Date( 2024, 0, 2 ) ],
			range: [ 0, 100 ],
		} );
		expect( getTickDecimalValues( band, 4 ) ).toBeUndefined();
		expect( getTickDecimalValues( time, 4 ) ).toBeUndefined();
		expect( getTickDecimalValues( undefined, 4 ) ).toBeUndefined();
	} );

	it( 'leaves a range with no whole tick to visx', () => {
		expect( getTickDecimalValues( linear( [ 0.2, 0.8 ] ), 4 ) ).toBeUndefined();
	} );

	it( 'leaves a range with only one whole tick to visx', () => {
		expect( getTickDecimalValues( linear( [ 0, 0.8 ] ), 4 ) ).toBeUndefined();
	} );

	it( 'keeps ticks at the given decimal places, through float error on small and large values', () => {
		expect( getTickDecimalValues( linear( [ 0, 0.07 ] ), 10, 2 ) ).toEqual( [
			0, 0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.07,
		] );
		expect( getTickDecimalValues( linear( [ 131072.01, 131072.02 ] ), 4, 2 ) ).toEqual( [
			131072.01, 131072.02,
		] );
	} );
} );

describe( 'getTickDecimalsDomain', () => {
	it.each( [
		[ 'widens a range inside one step', [ 0.3, 0.73 ], 0, [ 0, 1 ] ],
		[ 'widens a range between two steps', [ 1.2, 1.8 ], 0, [ 1, 2 ] ],
		[ 'widens at two decimals', [ 0.031, 0.034 ], 2, [ 0.03, 0.04 ] ],
		[ 'widens from a step float error puts just below', [ 0.29, 0.295 ], 2, [ 0.29, 0.3 ] ],
		[ 'widens ends float noise rounds to one step', [ 0.3, 0.1 + 0.2 ], 2, [ 0.3, 0.31 ] ],
		[ 'keeps a range holding two steps', [ 0, 1.2 ], 0, undefined ],
		[ 'keeps a range without tickDecimals', [ 0.3, 0.73 ], undefined, undefined ],
	] )( '%s', ( _, domain, decimals, expected ) => {
		expect( getTickDecimalsDomain( domain as [ number, number ], decimals ) ).toEqual( expected );
	} );
} );

describe( 'getTickDecimals', () => {
	it.each( [
		[ 'whole-number data over a caller decimals', true, 2, 0 ],
		[ 'fractional data at the caller decimals', false, 2, 2 ],
		[ 'fractional data without tickDecimals', false, undefined, undefined ],
	] )( 'holds %s', ( _, whole, decimals, expected ) => {
		expect( getTickDecimals( whole, decimals ) ).toBe( expected );
	} );
} );

describe( 'hasOnlyWholeNumbers', () => {
	it( 'is true when every reading is whole, skipping missing ones', () => {
		expect( hasOnlyWholeNumbers( [ series( 0, 1, null, 3 ) ] ) ).toBe( true );
	} );

	it( 'is false when any reading has a fraction', () => {
		expect( hasOnlyWholeNumbers( [ series( 0, 1 ), series( 0.5 ) ] ) ).toBe( false );
	} );

	it( 'is false when there is no reading at all', () => {
		expect( hasOnlyWholeNumbers( [ series( null, null ) ] ) ).toBe( false );
		expect( hasOnlyWholeNumbers( [] ) ).toBe( false );
	} );
} );
