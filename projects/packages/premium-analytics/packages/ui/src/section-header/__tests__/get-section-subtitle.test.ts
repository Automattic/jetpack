/**
 * Internal dependencies
 */
import { getSectionSubtitle } from '../get-section-subtitle';

/**
 * Build a range inside the current year, so the year never appears and the
 * assertions stay stable whenever the suite runs. The rendered range itself is
 * covered in `format-date-range-long.test.ts`; these tests own the composition.
 *
 * @param days - Length of the range in days.
 * @return A day-aligned range of `days` days.
 */
function currentYearRange( days: number ): { from: Date; to: Date } {
	const year = new Date().getFullYear();
	const from = new Date( year, 5, 1, 0, 0, 0, 0 );
	const to = new Date( year, 5, days, 23, 59, 59, 999 );

	return { from, to };
}

describe( 'getSectionSubtitle', () => {
	it( 'returns undefined when the range is incomplete', () => {
		expect( getSectionSubtitle( {} ) ).toBeUndefined();
		expect( getSectionSubtitle( { range: {} } ) ).toBeUndefined();
		expect( getSectionSubtitle( { range: { from: new Date( 2026, 6, 21 ) } } ) ).toBeUndefined();
	} );

	it( 'appends how long the range is', () => {
		expect( getSectionSubtitle( { range: currentYearRange( 7 ) } ) ).toContain( '(7 days)' );
	} );

	it( 'pluralizes a single-day range', () => {
		expect( getSectionSubtitle( { range: currentYearRange( 1 ) } ) ).toContain( '(1 day)' );
	} );

	it( 'describes a month-scale range in months', () => {
		expect(
			getSectionSubtitle( {
				range: { from: new Date( 2025, 6, 1 ), to: new Date( 2026, 5, 30, 23, 59, 59, 999 ) },
			} )
		).toBe( 'July 1, 2025 – June 30, 2026 (12 months)' );
	} );

	it( 'describes a rolling sub-day window in hours', () => {
		expect(
			getSectionSubtitle( {
				range: { from: new Date( 2026, 6, 28, 14, 30 ), to: new Date( 2026, 6, 29, 14, 30 ) },
			} )
		).toContain( '(24 hours)' );
	} );

	it( 'names the compared period when a comparison is applied', () => {
		expect(
			getSectionSubtitle( {
				range: currentYearRange( 7 ),
				comparisonPresetId: 'previous-period',
			} )
		).toMatch( /\(7 days\) vs\. Previous period$/ );
	} );

	it( 'omits the comparison when none is applied', () => {
		expect( getSectionSubtitle( { range: currentYearRange( 7 ) } ) ).not.toContain( 'vs.' );
	} );
} );
