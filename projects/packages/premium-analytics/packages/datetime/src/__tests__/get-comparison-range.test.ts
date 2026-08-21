/**
 * External dependencies
 */
import { differenceInCalendarDays } from 'date-fns';
/**
 * Internal dependencies
 */
import { COMPARISON_PRESETS, getComparisonRangeFromPreset } from '../get-comparison-range';
import { createTZDateFromParts } from '../tz';

describe( 'getComparisonRangeFromPreset', () => {
	it( 'returns undefined when the reference range is incomplete', () => {
		expect(
			getComparisonRangeFromPreset( { from: new Date( 2026, 6, 1 ) }, 'previous-period' )
		).toBeUndefined();
		expect( getComparisonRangeFromPreset( {}, 'previous-period' ) ).toBeUndefined();
	} );

	describe( 'day-aligned references', () => {
		const reference = {
			from: new Date( 2026, 5, 1, 0, 0, 0, 0 ),
			to: new Date( 2026, 5, 7, 23, 59, 59, 999 ),
		};

		it( 'mirrors the previous period on day bounds', () => {
			expect( getComparisonRangeFromPreset( reference, 'previous-period' ) ).toEqual( {
				from: new Date( 2026, 4, 25, 0, 0, 0, 0 ),
				to: new Date( 2026, 4, 31, 23, 59, 59, 999 ),
			} );
		} );

		it( 'shifts the previous month, clamping to day bounds', () => {
			expect( getComparisonRangeFromPreset( reference, 'previous-month' ) ).toEqual( {
				from: new Date( 2026, 4, 1, 0, 0, 0, 0 ),
				to: new Date( 2026, 4, 7, 23, 59, 59, 999 ),
			} );
		} );
	} );

	describe( 'rolling (sub-day) references', () => {
		// A rolling 24-hour window ending mid-afternoon, ends inclusive as the
		// presets build them (`endOfHour`).
		const reference = {
			from: new Date( 2026, 6, 9, 14, 30, 0, 0 ),
			to: new Date( 2026, 6, 10, 14, 29, 59, 999 ),
		};

		it( 'mirrors the exact previous window for previous-period', () => {
			expect( getComparisonRangeFromPreset( reference, 'previous-period' ) ).toEqual( {
				from: new Date( 2026, 6, 8, 14, 30, 0, 0 ),
				to: new Date( 2026, 6, 9, 14, 29, 59, 999 ),
			} );
		} );

		it( 'ends immediately before the reference begins', () => {
			const comparison = getComparisonRangeFromPreset( reference, 'previous-period' );

			expect( ( comparison?.to?.getTime() ?? 0 ) + 1 ).toBe( reference.from.getTime() );
		} );

		it( 'mirrors the hour-snapped 24-hour preset window one day back', () => {
			// The `last-24-hours` shape. Shifting by the exclusive span landed `to`
			// on the reference's own `from`, pulling every hourly comparison bucket
			// one hour late.
			const last24Hours = {
				from: new Date( 2026, 7, 17, 15, 0, 0, 0 ),
				to: new Date( 2026, 7, 18, 14, 59, 59, 999 ),
			};

			expect( getComparisonRangeFromPreset( last24Hours, 'previous-period' ) ).toEqual( {
				from: new Date( 2026, 7, 16, 15, 0, 0, 0 ),
				to: new Date( 2026, 7, 17, 14, 59, 59, 999 ),
			} );
		} );

		it( 'keeps the time of day for previous-month', () => {
			expect( getComparisonRangeFromPreset( reference, 'previous-month' ) ).toEqual( {
				from: new Date( 2026, 5, 9, 14, 30, 0, 0 ),
				to: new Date( 2026, 5, 10, 14, 29, 59, 999 ),
			} );
		} );

		it( 'keeps the time of day for previous-year', () => {
			expect( getComparisonRangeFromPreset( reference, 'previous-year' ) ).toEqual( {
				from: new Date( 2025, 6, 9, 14, 30, 0, 0 ),
				to: new Date( 2025, 6, 10, 14, 29, 59, 999 ),
			} );
		} );
	} );

	describe( 'rolling (sub-day) references across shorter months and leap day', () => {
		// A rolling 24-hour window at the end of March; February is shorter,
		// so a plain calendar shift would collapse both endpoints onto Feb 28.
		const endOfMarch = {
			from: new Date( 2026, 2, 30, 14, 0, 0, 0 ),
			to: new Date( 2026, 2, 31, 14, 0, 0, 0 ),
		};

		it.each( COMPARISON_PRESETS )( 'preserves the window duration for %s', presetId => {
			const comparison = getComparisonRangeFromPreset( endOfMarch, presetId );
			const durationMs = ( comparison?.to?.getTime() ?? 0 ) - ( comparison?.from?.getTime() ?? 0 );

			expect( durationMs ).toBe( 24 * 60 * 60 * 1000 );
		} );

		it( 'keeps a 24h window for previous-month when both endpoints would clamp', () => {
			expect( getComparisonRangeFromPreset( endOfMarch, 'previous-month' ) ).toEqual( {
				from: new Date( 2026, 1, 27, 14, 0, 0, 0 ),
				to: new Date( 2026, 1, 28, 14, 0, 0, 0 ),
			} );
		} );

		it( 'keeps a 48h window for previous-month when one endpoint would clamp', () => {
			const rolling48h = {
				from: new Date( 2026, 2, 30, 14, 0, 0, 0 ),
				to: new Date( 2026, 3, 1, 14, 0, 0, 0 ),
			};

			expect( getComparisonRangeFromPreset( rolling48h, 'previous-month' ) ).toEqual( {
				from: new Date( 2026, 1, 27, 14, 0, 0, 0 ),
				to: new Date( 2026, 2, 1, 14, 0, 0, 0 ),
			} );
		} );

		it( 'keeps a 24h window for previous-year across leap day', () => {
			const leapDay = {
				from: new Date( 2028, 1, 28, 14, 0, 0, 0 ),
				to: new Date( 2028, 1, 29, 14, 0, 0, 0 ),
			};

			expect( getComparisonRangeFromPreset( leapDay, 'previous-year' ) ).toEqual( {
				from: new Date( 2027, 1, 27, 14, 0, 0, 0 ),
				to: new Date( 2027, 1, 28, 14, 0, 0, 0 ),
			} );
		} );
	} );

	describe( 'day-aligned references that are not whole calendar months', () => {
		it.each( [
			// Shifting each endpoint on its own shortened this to 29 days.
			[
				'a rolling 30-day window',
				new Date( 2026, 6, 21, 0, 0, 0, 0 ),
				new Date( 2026, 7, 19, 23, 59, 59, 999 ),
				new Date( 2026, 5, 20, 0, 0, 0, 0 ),
				new Date( 2026, 6, 19, 23, 59, 59, 999 ),
			],
			// And this one to 6 days, across a year boundary.
			[
				'a week spanning a year boundary',
				new Date( 2025, 11, 29, 0, 0, 0, 0 ),
				new Date( 2026, 0, 4, 23, 59, 59, 999 ),
				new Date( 2025, 10, 28, 0, 0, 0, 0 ),
				new Date( 2025, 11, 4, 23, 59, 59, 999 ),
			],
			// The clamp grew this one instead: Mar 1 lands on Feb 1 while Jan 31
			// lands on Dec 31, a 33-day baseline for a 30-day range.
			[
				'a window whose start has no counterpart a month back',
				new Date( 2026, 0, 31, 0, 0, 0, 0 ),
				new Date( 2026, 2, 1, 23, 59, 59, 999 ),
				new Date( 2026, 0, 3, 0, 0, 0, 0 ),
				new Date( 2026, 1, 1, 23, 59, 59, 999 ),
			],
		] )(
			'keeps the reference length for previous-month with %s',
			( _label, from, to, expectedFrom, expectedTo ) => {
				expect( getComparisonRangeFromPreset( { from, to }, 'previous-month' ) ).toEqual( {
					from: expectedFrom,
					to: expectedTo,
				} );
			}
		);

		it( 'keeps the reference length for previous-year across a leap day', () => {
			// February 2028 has 29 days and February 2027 has 28, so shifting both
			// endpoints dropped a day from the baseline.
			const reference = {
				from: new Date( 2028, 1, 20, 0, 0, 0, 0 ),
				to: new Date( 2028, 2, 5, 23, 59, 59, 999 ),
			};

			expect( getComparisonRangeFromPreset( reference, 'previous-year' ) ).toEqual( {
				from: new Date( 2027, 1, 19, 0, 0, 0, 0 ),
				to: new Date( 2027, 2, 5, 23, 59, 59, 999 ),
			} );
		} );

		it.each( COMPARISON_PRESETS )(
			'covers the same number of days as the reference for %s',
			presetId => {
				const reference = {
					from: new Date( 2026, 0, 31, 0, 0, 0, 0 ),
					to: new Date( 2026, 2, 1, 23, 59, 59, 999 ),
				};
				const comparison = getComparisonRangeFromPreset( reference, presetId );
				const span = ( range?: { from?: Date; to?: Date } ) =>
					range?.from && range?.to ? differenceInCalendarDays( range.to, range.from ) : null;

				expect( span( comparison ) ).toBe( span( reference ) );
			}
		);
	} );

	describe( 'whole calendar months', () => {
		it( 'sets a whole month against the whole month before it', () => {
			// 31 days against 28 is the point of a month-over-month comparison,
			// so this one keeps the calendar shift.
			const march = {
				from: new Date( 2026, 2, 1, 0, 0, 0, 0 ),
				to: new Date( 2026, 2, 31, 23, 59, 59, 999 ),
			};

			expect( getComparisonRangeFromPreset( march, 'previous-month' ) ).toEqual( {
				from: new Date( 2026, 1, 1, 0, 0, 0, 0 ),
				to: new Date( 2026, 1, 28, 23, 59, 59, 999 ),
			} );
		} );

		it( 'keeps a multi-month window on month bounds', () => {
			// Shifting the end alone landed on Jan 28, ending the baseline
			// mid-month.
			const janToFeb = {
				from: new Date( 2026, 0, 1, 0, 0, 0, 0 ),
				to: new Date( 2026, 1, 28, 23, 59, 59, 999 ),
			};

			expect( getComparisonRangeFromPreset( janToFeb, 'previous-month' ) ).toEqual( {
				from: new Date( 2025, 11, 1, 0, 0, 0, 0 ),
				to: new Date( 2026, 0, 31, 23, 59, 59, 999 ),
			} );
		} );

		it( 'sets a leap February against the shorter one a year back', () => {
			const february2028 = {
				from: new Date( 2028, 1, 1, 0, 0, 0, 0 ),
				to: new Date( 2028, 1, 29, 23, 59, 59, 999 ),
			};

			expect( getComparisonRangeFromPreset( february2028, 'previous-year' ) ).toEqual( {
				from: new Date( 2027, 1, 1, 0, 0, 0, 0 ),
				to: new Date( 2027, 1, 28, 23, 59, 59, 999 ),
			} );
		} );

		it( "reads the month boundary in the range's own zone", () => {
			// The whole-month check runs on the incoming dates, so a site-zone
			// TZDate must not be read against UTC — in Auckland these parts are
			// March 1 and March 31, while their UTC instants are February 28 and
			// March 30.
			const timeZone = 'Pacific/Auckland';
			const march = {
				from: createTZDateFromParts( [ 2026, 2, 1, 0, 0, 0, 0 ], timeZone ),
				to: createTZDateFromParts( [ 2026, 2, 31, 23, 59, 59, 999 ], timeZone ),
			};

			const comparison = getComparisonRangeFromPreset( march, 'previous-month' );

			expect( comparison?.from?.getDate() ).toBe( 1 );
			expect( comparison?.from?.getMonth() ).toBe( 1 );
			expect( comparison?.to?.getDate() ).toBe( 28 );
			expect( comparison?.to?.getMonth() ).toBe( 1 );
		} );

		it( 'still mirrors the reference length for previous-period', () => {
			const march = {
				from: new Date( 2026, 2, 1, 0, 0, 0, 0 ),
				to: new Date( 2026, 2, 31, 23, 59, 59, 999 ),
			};

			expect( getComparisonRangeFromPreset( march, 'previous-period' ) ).toEqual( {
				from: new Date( 2026, 0, 29, 0, 0, 0, 0 ),
				to: new Date( 2026, 1, 28, 23, 59, 59, 999 ),
			} );
		} );
	} );
} );
