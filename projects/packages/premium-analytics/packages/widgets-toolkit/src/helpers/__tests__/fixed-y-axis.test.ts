import { getPaddedYAxis } from '../fixed-y-axis';

const series = ( ...values: Array< number | null > ) => [
	{ data: values.map( ( value, index ) => ( { date: new Date( 2026, 8, 12 + index ), value } ) ) },
];

describe( 'getPaddedYAxis', () => {
	test( 'pads a small change so the data fills about half the chart', () => {
		expect( getPaddedYAxis( series( 140, 141, 144 ) ) ).toEqual( { domain: [ 136, 144 ] } );
	} );

	test( 'pads by the range when it is under a fifth of the minimum', () => {
		expect( getPaddedYAxis( series( 1000, 1010 ) ) ).toEqual( { domain: [ 990, 1010 ] } );
	} );

	test( 'caps the padding at a fifth of the minimum', () => {
		expect( getPaddedYAxis( series( 100, 150 ) ) ).toEqual( { domain: [ 80, 150 ] } );
	} );

	test( 'gives a flat series an axis instead of a collapsed one', () => {
		expect( getPaddedYAxis( series( 140, 140 ) ) ).toEqual( { domain: [ 112, 140 ] } );
	} );

	test( 'reads across every series and skips missing readings', () => {
		const data = [ ...series( 140, null, 144 ), ...series( 130, 150 ) ];
		expect( getPaddedYAxis( data ) ).toEqual( { domain: [ 110, 150 ] } );
	} );

	test( 'widens a one-unit change to four units so the ticks stay whole', () => {
		expect( getPaddedYAxis( series( 140, 141 ) ) ).toEqual( { domain: [ 137, 141 ] } );
	} );

	test( 'leaves an axis that would start at zero to the chart', () => {
		expect( getPaddedYAxis( series( 2, 3 ) ) ).toBeNull();
	} );

	test( 'leaves a series that touches zero to the chart', () => {
		expect( getPaddedYAxis( series( 0, 5 ) ) ).toBeNull();
	} );

	test( 'leaves an empty series to the chart', () => {
		expect( getPaddedYAxis( series( null, null ) ) ).toBeNull();
	} );
} );
