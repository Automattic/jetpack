/**
 * Internal dependencies
 */
import { COMPARISON_PRESETS, getComparisonRangeFromPreset } from '../get-comparison-range';

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
		// A rolling 24-hour window ending mid-afternoon.
		const reference = {
			from: new Date( 2026, 6, 9, 14, 30, 0, 0 ),
			to: new Date( 2026, 6, 10, 14, 30, 0, 0 ),
		};

		it( 'ends the previous-period window just before the reference begins', () => {
			expect( getComparisonRangeFromPreset( reference, 'previous-period' ) ).toEqual( {
				from: new Date( 2026, 6, 8, 14, 29, 59, 999 ),
				to: new Date( 2026, 6, 9, 14, 29, 59, 999 ),
			} );
		} );

		it( 'keeps the time of day for previous-month', () => {
			expect( getComparisonRangeFromPreset( reference, 'previous-month' ) ).toEqual( {
				from: new Date( 2026, 5, 9, 14, 30, 0, 0 ),
				to: new Date( 2026, 5, 10, 14, 30, 0, 0 ),
			} );
		} );

		it( 'keeps the time of day for previous-year', () => {
			expect( getComparisonRangeFromPreset( reference, 'previous-year' ) ).toEqual( {
				from: new Date( 2025, 6, 9, 14, 30, 0, 0 ),
				to: new Date( 2025, 6, 10, 14, 30, 0, 0 ),
			} );
		} );
	} );

	describe( 'inclusive rolling references, as the last-24-hours preset builds them', () => {
		// The shape computePrimaryRange( 'last-24-hours' ) actually produces:
		// hour-aligned start, open-ended `:59:59.999` end. The half-open
		// reference above is not a shape the dashboard generates.
		const reference = {
			from: new Date( 2026, 5, 14, 9, 0, 0, 0 ),
			to: new Date( 2026, 5, 15, 8, 59, 59, 999 ),
		};

		it( 'keeps the comparison adjacent to the primary, on the same hour boundary', () => {
			expect( getComparisonRangeFromPreset( reference, 'previous-period' ) ).toEqual( {
				from: new Date( 2026, 5, 13, 9, 0, 0, 0 ),
				to: new Date( 2026, 5, 14, 8, 59, 59, 999 ),
			} );
		} );

		it.each( COMPARISON_PRESETS )( 'lands on hour boundaries for %s', presetId => {
			const comparison = getComparisonRangeFromPreset( reference, presetId );

			expect( comparison?.from?.getMinutes() ).toBe( 0 );
			expect( comparison?.from?.getMilliseconds() ).toBe( 0 );
			expect( comparison?.to?.getMinutes() ).toBe( 59 );
			expect( comparison?.to?.getMilliseconds() ).toBe( 999 );
		} );

		it( 'never overlaps the primary window', () => {
			COMPARISON_PRESETS.forEach( presetId => {
				const comparison = getComparisonRangeFromPreset( reference, presetId );

				expect( comparison!.to!.getTime() ).toBeLessThan( reference.from.getTime() );
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
} );
