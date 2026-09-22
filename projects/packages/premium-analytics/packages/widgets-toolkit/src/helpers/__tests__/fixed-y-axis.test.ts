import { getPaddedYDomain } from '../fixed-y-axis';

const series = ( ...values: Array< number | null > ) => [
	{ data: values.map( ( value, index ) => ( { date: new Date( 2026, 8, 12 + index ), value } ) ) },
];

describe( 'getPaddedYDomain', () => {
	test( 'pads a small change so the data fills about half the chart', () => {
		expect( getPaddedYDomain( series( 140, 141, 144 ) ) ).toEqual( [ 136, 144 ] );
	} );

	test( 'pads by the range when it is under a fifth of the minimum', () => {
		expect( getPaddedYDomain( series( 1000, 1010 ) ) ).toEqual( [ 990, 1010 ] );
	} );

	test( 'caps the padding at a fifth of the minimum', () => {
		expect( getPaddedYDomain( series( 100, 150 ) ) ).toEqual( [ 80, 150 ] );
	} );

	test( 'gives a flat series an axis instead of a collapsed one', () => {
		expect( getPaddedYDomain( series( 140, 140 ) ) ).toEqual( [ 112, 140 ] );
	} );

	test( 'reads across every series and skips missing readings', () => {
		const data = [ ...series( 140, null, 144 ), ...series( 130, 150 ) ];
		expect( getPaddedYDomain( data ) ).toEqual( [ 110, 150 ] );
	} );

	test( 'widens a one-unit change to four units so the ticks stay whole', () => {
		expect( getPaddedYDomain( series( 140, 141 ) ) ).toEqual( [ 137, 141 ] );
	} );

	test( 'never pads below zero', () => {
		expect( getPaddedYDomain( series( 2, 3 ) ) ).toEqual( [ 0, 3 ] );
	} );

	test( 'leaves a series that touches zero to the chart', () => {
		expect( getPaddedYDomain( series( 0, 5 ) ) ).toBeNull();
	} );

	test( 'leaves an empty series to the chart', () => {
		expect( getPaddedYDomain( series( null, null ) ) ).toBeNull();
	} );
} );
