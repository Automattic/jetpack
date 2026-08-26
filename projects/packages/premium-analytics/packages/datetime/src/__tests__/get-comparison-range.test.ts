/**
 * Internal dependencies
 */
import { getDateRangeSpan } from '../date-range-span';
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
			// The `last-24-hours` shape: shifting by the exclusive span landed `to` on
			// the reference's own `from`, pulling hourly buckets one hour late.
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
			[
				'a rolling 30-day window',
				new Date( 2026, 6, 21, 0, 0, 0, 0 ),
				new Date( 2026, 7, 19, 23, 59, 59, 999 ),
				new Date( 2026, 5, 20, 0, 0, 0, 0 ),
				new Date( 2026, 6, 19, 23, 59, 59, 999 ),
			],
			[
				'a window whose end clamps in a shorter month',
				new Date( 2026, 2, 2, 0, 0, 0, 0 ),
				new Date( 2026, 2, 31, 23, 59, 59, 999 ),
				new Date( 2026, 0, 30, 0, 0, 0, 0 ),
				new Date( 2026, 1, 28, 23, 59, 59, 999 ),
			],
			[
				'a week spanning a year boundary',
				new Date( 2025, 11, 29, 0, 0, 0, 0 ),
				new Date( 2026, 0, 4, 23, 59, 59, 999 ),
				new Date( 2025, 10, 28, 0, 0, 0, 0 ),
				new Date( 2025, 11, 4, 23, 59, 59, 999 ),
			],
			[
				'a window that starts on the 1st but stops short of the month end',
				new Date( 2026, 2, 1, 0, 0, 0, 0 ),
				new Date( 2026, 2, 15, 23, 59, 59, 999 ),
				new Date( 2026, 1, 1, 0, 0, 0, 0 ),
				new Date( 2026, 1, 15, 23, 59, 59, 999 ),
			],
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

				expect( getDateRangeSpan( comparison ) ).toEqual( getDateRangeSpan( reference ) );
			}
		);
	} );

	describe( 'whole calendar months', () => {
		it( 'sets a whole month against the whole month before it', () => {
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

		/*
		 * The previous period of a whole-months window steps back by the month
		 * count (WOOA7S-2028): a 31-day shift would put March against a window
		 * straddling January and February.
		 */
		it( 'sets a whole month against the whole month before it for previous-period', () => {
			const march = {
				from: new Date( 2026, 2, 1, 0, 0, 0, 0 ),
				to: new Date( 2026, 2, 31, 23, 59, 59, 999 ),
			};

			expect( getComparisonRangeFromPreset( march, 'previous-period' ) ).toEqual( {
				from: new Date( 2026, 1, 1, 0, 0, 0, 0 ),
				to: new Date( 2026, 1, 28, 23, 59, 59, 999 ),
			} );
		} );

		/*
		 * A 365-day shift of a calendar year would land on Jan 2 across leap
		 * 2024; the month-count step keeps calendar years whole.
		 */
		it( 'sets a calendar year against the previous calendar year for previous-period', () => {
			const year2025 = {
				from: new Date( 2025, 0, 1, 0, 0, 0, 0 ),
				to: new Date( 2025, 11, 31, 23, 59, 59, 999 ),
			};

			expect( getComparisonRangeFromPreset( year2025, 'previous-period' ) ).toEqual( {
				from: new Date( 2024, 0, 1, 0, 0, 0, 0 ),
				to: new Date( 2024, 11, 31, 23, 59, 59, 999 ),
			} );
		} );

		/*
		 * Whole months are detected by round trip, not calendar alignment, so
		 * the rolling last-12-months window (mid-month to mid-month) also steps
		 * back by its month count.
		 */
		it( 'steps a rolling 12-month window back by its month count for previous-period', () => {
			const last12Months = {
				from: new Date( 2025, 7, 31, 0, 0, 0, 0 ),
				to: new Date( 2026, 7, 30, 23, 59, 59, 999 ),
			};

			expect( getComparisonRangeFromPreset( last12Months, 'previous-period' ) ).toEqual( {
				from: new Date( 2024, 7, 31, 0, 0, 0, 0 ),
				to: new Date( 2025, 7, 30, 23, 59, 59, 999 ),
			} );
		} );
	} );

	describe( 'previous-week', () => {
		it( 'shifts a day-aligned range back seven days on day bounds', () => {
			const yesterday = {
				from: new Date( 2026, 7, 30, 0, 0, 0, 0 ),
				to: new Date( 2026, 7, 30, 23, 59, 59, 999 ),
			};

			expect( getComparisonRangeFromPreset( yesterday, 'previous-week' ) ).toEqual( {
				from: new Date( 2026, 7, 23, 0, 0, 0, 0 ),
				to: new Date( 2026, 7, 23, 23, 59, 59, 999 ),
			} );
		} );

		it( 'keeps the time of day for a rolling window', () => {
			const rolling = {
				from: new Date( 2026, 6, 9, 14, 30, 0, 0 ),
				to: new Date( 2026, 6, 10, 14, 29, 59, 999 ),
			};

			expect( getComparisonRangeFromPreset( rolling, 'previous-week' ) ).toEqual( {
				from: new Date( 2026, 6, 2, 14, 30, 0, 0 ),
				to: new Date( 2026, 6, 3, 14, 29, 59, 999 ),
			} );
		} );

		/*
		 * For a 7-day range the week shift equals the previous period — the
		 * reason the options builder lists only one of them.
		 */
		it( 'matches the previous period exactly at seven days', () => {
			const week = {
				from: new Date( 2026, 5, 1, 0, 0, 0, 0 ),
				to: new Date( 2026, 5, 7, 23, 59, 59, 999 ),
			};

			expect( getComparisonRangeFromPreset( week, 'previous-week' ) ).toEqual(
				getComparisonRangeFromPreset( week, 'previous-period' )
			);
		} );
	} );

	describe( 'whole-month and whole-year references', () => {
		it( 'moves a calendar year back by a year, not by its day count', () => {
			// 2024 has 366 days, so 365 days back from 1 January 2025 is
			// 2 January 2024, and the previous period drops New Year's Day.
			expect(
				getComparisonRangeFromPreset(
					{
						from: new Date( 2025, 0, 1, 0, 0, 0, 0 ),
						to: new Date( 2025, 11, 31, 23, 59, 59, 999 ),
					},
					'previous-period'
				)
			).toEqual( {
				from: new Date( 2024, 0, 1, 0, 0, 0, 0 ),
				to: new Date( 2024, 11, 31, 23, 59, 59, 999 ),
			} );
		} );

		it( 'moves twelve rolling months back by calendar months', () => {
			expect(
				getComparisonRangeFromPreset(
					{
						from: new Date( 2025, 7, 20, 0, 0, 0, 0 ),
						to: new Date( 2026, 7, 19, 23, 59, 59, 999 ),
					},
					'previous-period'
				)
			).toEqual( {
				from: new Date( 2024, 7, 20, 0, 0, 0, 0 ),
				to: new Date( 2025, 7, 19, 23, 59, 59, 999 ),
			} );
		} );

		it( 'ends the previous whole months on a month end, whatever day the reference ends on', () => {
			// January through February: moving the end back two months would
			// land it on 28 December, not on the end of December.
			expect(
				getComparisonRangeFromPreset(
					{
						from: new Date( 2026, 0, 1, 0, 0, 0, 0 ),
						to: new Date( 2026, 1, 28, 23, 59, 59, 999 ),
					},
					'previous-period'
				)
			).toEqual( {
				from: new Date( 2025, 10, 1, 0, 0, 0, 0 ),
				to: new Date( 2025, 11, 31, 23, 59, 59, 999 ),
			} );
		} );
	} );

	describe( 'to-date presets', () => {
		// `last-12-months` as read on 20 August 2026.
		const reference = {
			from: new Date( 2025, 8, 1, 0, 0, 0, 0 ),
			to: new Date( 2026, 7, 20, 23, 59, 59, 999 ),
		};

		it( 'takes the previous period from the completed window', () => {
			expect(
				getComparisonRangeFromPreset( reference, 'previous-period', {
					primaryPresetId: 'last-12-months',
				} )
			).toEqual( {
				from: new Date( 2024, 8, 1, 0, 0, 0, 0 ),
				to: new Date( 2025, 7, 31, 23, 59, 59, 999 ),
			} );
		} );

		it( 'compares the previous month and year with the days read so far', () => {
			// Year over year and month over month stay to-date, so the totals
			// line up with the same days a year or a month earlier.
			expect(
				getComparisonRangeFromPreset( reference, 'previous-year', {
					primaryPresetId: 'last-12-months',
				} )
			).toEqual( {
				from: new Date( 2024, 8, 1, 0, 0, 0, 0 ),
				to: new Date( 2025, 7, 20, 23, 59, 59, 999 ),
			} );
			expect(
				getComparisonRangeFromPreset( reference, 'previous-month', {
					primaryPresetId: 'last-12-months',
				} )
			).toEqual( {
				from: new Date( 2025, 7, 1, 0, 0, 0, 0 ),
				to: new Date( 2026, 6, 20, 23, 59, 59, 999 ),
			} );
		} );

		it( 'measures the same dates by the day under any other preset', () => {
			// Picked by hand, the window has no running month: 354 days back.
			expect(
				getComparisonRangeFromPreset( reference, 'previous-period', { primaryPresetId: 'custom' } )
			).toEqual( {
				from: new Date( 2024, 8, 12, 0, 0, 0, 0 ),
				to: new Date( 2025, 7, 31, 23, 59, 59, 999 ),
			} );
		} );
	} );
} );
