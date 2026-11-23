/**
 * Internal dependencies
 */
import { daysCovered, isMonthIncomplete } from '../month-key';

// Mid-March: the current month has 15 of its 31 days so far.
const TODAY = new Date( 2026, 2, 15 );

const MARCH = { year: 2026, month: 2 };
const FEBRUARY = { year: 2026, month: 1 };
const NOVEMBER = { year: 2025, month: 10 };

describe( 'daysCovered', () => {
	it( 'counts a whole month outside the first month and the current one', () => {
		expect( daysCovered( FEBRUARY, TODAY ) ).toBe( 28 );
	} );

	it( 'counts the current month up to today', () => {
		expect( daysCovered( MARCH, TODAY ) ).toBe( 15 );
	} );

	it( 'counts the first month from its first day', () => {
		expect( daysCovered( NOVEMBER, TODAY, { ...NOVEMBER, day: 24 } ) ).toBe( 7 );
	} );

	it( 'counts from the first day up to today when both fall in one month', () => {
		expect( daysCovered( MARCH, TODAY, { ...MARCH, day: 10 } ) ).toBe( 6 );
	} );

	it( 'counts one day when a browser clock behind the server puts the first day after today', () => {
		expect( daysCovered( MARCH, TODAY, { ...MARCH, day: 20 } ) ).toBe( 1 );
	} );
} );

describe( 'isMonthIncomplete', () => {
	it( 'calls the current month short, since it has not finished', () => {
		expect( isMonthIncomplete( MARCH, 'total', TODAY ) ).toBe( true );
	} );

	it( 'calls the current month whole on the last day of the month', () => {
		expect( isMonthIncomplete( MARCH, 'total', new Date( 2026, 2, 31 ) ) ).toBe( false );
	} );

	it( 'calls the first month short when its first day falls after the 1st', () => {
		expect( isMonthIncomplete( NOVEMBER, 'total', TODAY, { ...NOVEMBER, day: 24 } ) ).toBe( true );
	} );

	it( 'calls the first month whole when its first day is the 1st', () => {
		expect( isMonthIncomplete( NOVEMBER, 'total', TODAY, { ...NOVEMBER, day: 1 } ) ).toBe( false );
	} );

	it( 'calls a month between the first and the current one whole', () => {
		expect( isMonthIncomplete( FEBRUARY, 'total', TODAY, { ...NOVEMBER, day: 24 } ) ).toBe( false );
	} );

	it( 'calls nothing short under the average metric, which is already per day', () => {
		expect( isMonthIncomplete( MARCH, 'average', TODAY ) ).toBe( false );
		expect( isMonthIncomplete( NOVEMBER, 'average', TODAY, { ...NOVEMBER, day: 24 } ) ).toBe(
			false
		);
	} );
} );
