/**
 * Unit tests for date parsing utilities
 *
 * These tests verify the behavior of parseAsLocalDate function across various
 * input formats and edge cases. Tests are written for Jest testing framework.
 *
 */

import { parseAsLocalDate } from '../date-parsing';

describe( 'parseAsLocalDate', () => {
	describe( 'Date-only formats (treated as local)', () => {
		test( 'should parse YYYY-MM-DD format', () => {
			const result = parseAsLocalDate( '2025-01-15' );

			expect( result.getFullYear() ).toBe( 2025 );
			expect( result.getMonth() ).toBe( 0 ); // January is 0
			expect( result.getDate() ).toBe( 15 );
			expect( result.getHours() ).toBe( 0 );
			expect( result.getMinutes() ).toBe( 0 );
			expect( result.getSeconds() ).toBe( 0 );
		} );

		test( 'should handle leap year dates', () => {
			const result = parseAsLocalDate( '2024-02-29' );

			expect( result.getFullYear() ).toBe( 2024 );
			expect( result.getMonth() ).toBe( 1 ); // February is 1
			expect( result.getDate() ).toBe( 29 );
		} );
	} );

	describe( 'Space-separated datetime formats (treated as local)', () => {
		test( 'should parse YYYY-MM-DD HH:mm:ss format', () => {
			const result = parseAsLocalDate( '2025-01-15 14:30:45' );

			expect( result.getFullYear() ).toBe( 2025 );
			expect( result.getMonth() ).toBe( 0 );
			expect( result.getDate() ).toBe( 15 );
			expect( result.getHours() ).toBe( 14 );
			expect( result.getMinutes() ).toBe( 30 );
			expect( result.getSeconds() ).toBe( 45 );
		} );

		test( 'should handle midnight time', () => {
			const result = parseAsLocalDate( '2025-01-15 00:00:00' );

			expect( result.getHours() ).toBe( 0 );
			expect( result.getMinutes() ).toBe( 0 );
			expect( result.getSeconds() ).toBe( 0 );
		} );

		test( 'should handle end of day time', () => {
			const result = parseAsLocalDate( '2025-01-15 23:59:59' );

			expect( result.getHours() ).toBe( 23 );
			expect( result.getMinutes() ).toBe( 59 );
			expect( result.getSeconds() ).toBe( 59 );
		} );

		test( 'should parse YYYY-MM-DD HH:mm format (without seconds)', () => {
			const result = parseAsLocalDate( '2025-01-15 14:30' );

			expect( result.getFullYear() ).toBe( 2025 );
			expect( result.getMonth() ).toBe( 0 );
			expect( result.getDate() ).toBe( 15 );
			expect( result.getHours() ).toBe( 14 );
			expect( result.getMinutes() ).toBe( 30 );
			expect( result.getSeconds() ).toBe( 0 ); // Should default to 0
		} );

		test( 'should parse YYYY-MM-DD HH:mm with midnight', () => {
			const result = parseAsLocalDate( '2024-01-05 00:00' );

			expect( result.getFullYear() ).toBe( 2024 );
			expect( result.getMonth() ).toBe( 0 );
			expect( result.getDate() ).toBe( 5 );
			expect( result.getHours() ).toBe( 0 );
			expect( result.getMinutes() ).toBe( 0 );
			expect( result.getSeconds() ).toBe( 0 );
		} );

		test( 'should parse YYYY-MM-DD HH:mm with end of day', () => {
			const result = parseAsLocalDate( '2025-01-15 23:45' );

			expect( result.getHours() ).toBe( 23 );
			expect( result.getMinutes() ).toBe( 45 );
			expect( result.getSeconds() ).toBe( 0 );
		} );
	} );

	describe( 'ISO formats without timezone (treated as local)', () => {
		test( 'should parse YYYY-MM-DDTHH:mm:ss format', () => {
			const result = parseAsLocalDate( '2025-01-15T14:30:45' );

			expect( result.getFullYear() ).toBe( 2025 );
			expect( result.getMonth() ).toBe( 0 );
			expect( result.getDate() ).toBe( 15 );
			expect( result.getHours() ).toBe( 14 );
			expect( result.getMinutes() ).toBe( 30 );
			expect( result.getSeconds() ).toBe( 45 );
		} );

		test( 'should parse YYYY-MM-DDTHH:mm:ss.SSS format (milliseconds ignored)', () => {
			const result = parseAsLocalDate( '2025-01-15T14:30:45.123' );

			expect( result.getFullYear() ).toBe( 2025 );
			expect( result.getMonth() ).toBe( 0 );
			expect( result.getDate() ).toBe( 15 );
			expect( result.getHours() ).toBe( 14 );
			expect( result.getMinutes() ).toBe( 30 );
			expect( result.getSeconds() ).toBe( 45 );
		} );

		test( 'should parse YYYY-MM-DDTHH:mm format (without seconds)', () => {
			const result = parseAsLocalDate( '2025-01-15T14:30' );

			expect( result.getFullYear() ).toBe( 2025 );
			expect( result.getMonth() ).toBe( 0 );
			expect( result.getDate() ).toBe( 15 );
			expect( result.getHours() ).toBe( 14 );
			expect( result.getMinutes() ).toBe( 30 );
			expect( result.getSeconds() ).toBe( 0 ); // Should default to 0
		} );

		test( 'should parse YYYY-MM-DDTHH:mm with midnight', () => {
			const result = parseAsLocalDate( '2024-01-05T00:00' );

			expect( result.getFullYear() ).toBe( 2024 );
			expect( result.getMonth() ).toBe( 0 );
			expect( result.getDate() ).toBe( 5 );
			expect( result.getHours() ).toBe( 0 );
			expect( result.getMinutes() ).toBe( 0 );
			expect( result.getSeconds() ).toBe( 0 );
		} );
	} );

	describe( 'ISO formats with timezone (converted to local)', () => {
		test( 'should parse UTC timezone (Z)', () => {
			const result = parseAsLocalDate( '2025-01-15T14:30:45Z' );

			// The exact local time depends on the system timezone
			// We can verify it's a valid date and maintains the structure
			expect( result instanceof Date ).toBe( true );
			expect( isNaN( result.getTime() ) ).toBe( false );
			expect( result.getFullYear() ).toBe( 2025 );
			expect( result.getMonth() ).toBe( 0 );
			expect( result.getDate() ).toBe( 15 );
		} );

		test( 'should parse positive timezone offset', () => {
			const result = parseAsLocalDate( '2025-01-15T14:30:45+05:00' );

			expect( result instanceof Date ).toBe( true );
			expect( isNaN( result.getTime() ) ).toBe( false );
			expect( result.getFullYear() ).toBe( 2025 );
			expect( result.getMonth() ).toBe( 0 );
		} );

		test( 'should parse negative timezone offset', () => {
			const result = parseAsLocalDate( '2025-01-15T14:30:45-08:00' );

			expect( result instanceof Date ).toBe( true );
			expect( isNaN( result.getTime() ) ).toBe( false );
			expect( result.getFullYear() ).toBe( 2025 );
			expect( result.getMonth() ).toBe( 0 );
		} );

		test( 'should parse timezone offset without colon', () => {
			const result = parseAsLocalDate( '2025-01-15T14:30:45+0530' );

			expect( result instanceof Date ).toBe( true );
			expect( isNaN( result.getTime() ) ).toBe( false );
		} );

		test( 'should handle UTC with milliseconds', () => {
			const result = parseAsLocalDate( '2025-01-15T14:30:45.123Z' );

			expect( result instanceof Date ).toBe( true );
			expect( isNaN( result.getTime() ) ).toBe( false );
		} );
	} );

	describe( 'Timezone conversion behavior', () => {
		test( 'same moment in different timezones should have different local representations', () => {
			// Same moment in time, different timezone representations
			const utc = parseAsLocalDate( '2025-01-15T12:00:00Z' );
			const plus5 = parseAsLocalDate( '2025-01-15T17:00:00+05:00' );
			const minus8 = parseAsLocalDate( '2025-01-15T04:00:00-08:00' );

			// These should all represent the same moment in time
			expect( utc.getTime() ).toBe( plus5.getTime() );
			expect( utc.getTime() ).toBe( minus8.getTime() );
		} );

		test( 'naive vs timezone-aware strings should produce different results for same wall time', () => {
			const naive = parseAsLocalDate( '2025-01-15T12:00:00' );
			const utc = parseAsLocalDate( '2025-01-15T12:00:00Z' );

			// The naive one is 12:00 local time, the UTC one is 12:00 UTC converted to local
			// These represent different moments unless the system happens to be in UTC
			const systemTimezoneOffset = new Date().getTimezoneOffset();
			const timeDifference = Math.abs( naive.getTime() - utc.getTime() );

			// Time difference should equal the timezone offset (in milliseconds)
			const expectedDifference = Math.abs( systemTimezoneOffset * 60 * 1000 );
			expect( timeDifference ).toBe( expectedDifference );
		} );
	} );

	describe( 'Input validation and error handling', () => {
		test( 'should return invalid date for malformed input', () => {
			const invalidInputs = [
				'invalid-date',
				'2025-13-01', // Invalid month
				'2025-01-32', // Invalid day
				'2025-01-01 25:00:00', // Invalid hour
				'2025-01-01 12:60:00', // Invalid minute
				'2025-01-01 12:30:60', // Invalid second
				'', // Empty string
				'2025', // Incomplete date
				'01-01-2025', // Wrong format
			];

			invalidInputs.forEach( input => {
				const result = parseAsLocalDate( input );
				expect( isNaN( result.getTime() ) ).toBe( true );
			} );
		} );

		test( 'should handle whitespace in input', () => {
			const result = parseAsLocalDate( '  2025-01-15T14:30:45  ' );

			expect( result.getFullYear() ).toBe( 2025 );
			expect( result.getMonth() ).toBe( 0 );
			expect( result.getDate() ).toBe( 15 );
			expect( result.getHours() ).toBe( 14 );
			expect( result.getMinutes() ).toBe( 30 );
			expect( result.getSeconds() ).toBe( 45 );
		} );
	} );

	describe( 'Edge cases', () => {
		test( 'should handle year boundaries', () => {
			const newYear = parseAsLocalDate( '2025-01-01T00:00:00' );
			const yearEnd = parseAsLocalDate( '2024-12-31T23:59:59' );

			expect( newYear.getFullYear() ).toBe( 2025 );
			expect( yearEnd.getFullYear() ).toBe( 2024 );
		} );

		test( 'should handle month boundaries', () => {
			const monthStart = parseAsLocalDate( '2025-02-01T00:00:00' );
			const monthEnd = parseAsLocalDate( '2025-01-31T23:59:59' );

			expect( monthStart.getMonth() ).toBe( 1 ); // February
			expect( monthEnd.getMonth() ).toBe( 0 ); // January
		} );

		test( 'should handle non-leap year February', () => {
			const result = parseAsLocalDate( '2025-02-28' ); // 2025 is not a leap year
			expect( result.getDate() ).toBe( 28 );
			expect( result.getMonth() ).toBe( 1 ); // February

			// Feb 29 in non-leap year - Not valid
			const feb29 = parseAsLocalDate( '2025-02-29' );
			expect( isNaN( feb29.getTime() ) ).toBe( true );
		} );
	} );

	describe( 'Performance and consistency', () => {
		test( 'should consistently parse the same input', () => {
			const dateString = '2025-01-15T14:30:45Z';
			const results = Array.from( { length: 10 }, () => parseAsLocalDate( dateString ) );

			// All results should be identical
			const firstTime = results[ 0 ].getTime();
			results.forEach( result => {
				expect( result.getTime() ).toBe( firstTime );
			} );
		} );

		test( 'should handle batch parsing efficiently', () => {
			const testDates = [
				'2025-01-01',
				'2025-01-02T12:00:00',
				'2025-01-03T12:00:00Z',
				'2025-01-04T12:00:00+05:00',
				'2025-01-05 12:00:00',
				'2024-01-05 00:00',
				'2025-01-06T14:30',
			];

			const startTime = performance.now();
			const results = testDates.map( parseAsLocalDate );
			const endTime = performance.now();

			// Should complete quickly (this is more of a smoke test)
			expect( endTime - startTime ).toBeLessThan( 100 ); // 100ms for 7 operations
			expect( results ).toHaveLength( 7 );
			results.forEach( result => {
				expect( result instanceof Date ).toBe( true );
			} );
		} );
	} );
} );
