/**
 * @jest-environment <rootDir>/tests/environment-chatham.mjs
 */

import { civilDate, instantDayReader, pointDayKey, startOfCivilWeek } from '../private/civil-day';

const readUtc = instantDayReader( 'UTC' );

describe( 'civilDate', () => {
	test( 'rejects a day the calendar does not have', () => {
		expect( civilDate( '2024-02-30' ) ).toBeNull();
		expect( civilDate( '2024-13-01' ) ).toBeNull();
	} );

	test( 'reads a year below 1000 as itself, not as 19xx', () => {
		expect( civilDate( '0099-01-05' )?.getUTCFullYear() ).toBe( 99 );
	} );
} );

describe( 'instantDayReader', () => {
	test( 'drops a year too wide for a four-digit key', () => {
		expect( readUtc( new Date( 1e15 ) ) ).toBeNull();
	} );
} );

describe( 'pointDayKey', () => {
	// The same instant, written four ways ISO 8601 allows.
	test.each( [ 'Z', '+00:00', '+0000', '+00' ] )( 'reads an offset written %s', offset => {
		expect(
			pointDayKey( { dateString: `2024-01-03T23:30:00${ offset }`, value: 1 }, readUtc )
		).toBe( '2024-01-03' );
	} );

	test( 'an hour-only offset re-dates the point like a full one', () => {
		const readTokyo = instantDayReader( 'Asia/Tokyo' );

		// 04:30 UTC, so Tokyo has already turned over to the 4th.
		expect( pointDayKey( { dateString: '2024-01-03T23:30:00-05', value: 1 }, readTokyo ) ).toBe(
			'2024-01-04'
		);
		expect( pointDayKey( { dateString: '2024-01-03T23:30:00-05:00', value: 1 }, readTokyo ) ).toBe(
			'2024-01-04'
		);
	} );

	test( 'a datetime with no offset keeps the day it was written with', () => {
		expect( pointDayKey( { dateString: '2024-01-03T23:30:00', value: 1 }, readUtc ) ).toBe(
			'2024-01-03'
		);
	} );

	test( 'falls through to dateString when date carries an unreadable year', () => {
		expect(
			pointDayKey( { date: new Date( 1e15 ), dateString: '2024-01-03', value: 1 }, readUtc )
		).toBe( '2024-01-03' );
	} );
} );

describe( 'startOfCivilWeek', () => {
	test.each( [
		[ 1 as const, '2024-01-01' ],
		[ 0 as const, '2023-12-31' ],
	] )( 'rounds Wed Jan 3 2024 down for weekStartsOn %i', ( weekStartsOn, expected ) => {
		const wednesday = civilDate( '2024-01-03' );

		expect( startOfCivilWeek( wednesday!, weekStartsOn ).toISOString().slice( 0, 10 ) ).toBe(
			expected
		);
	} );
} );
