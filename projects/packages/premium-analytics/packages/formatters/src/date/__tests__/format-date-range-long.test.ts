/**
 * Internal dependencies
 */
import { formatDateRangeLong } from '../format-date-range-long';

/**
 * Build a local-time date, so day boundaries land in the frame `date-fns` reads.
 *
 * @param year  - Full year.
 * @param month - 1-indexed month.
 * @param day   - Day of month.
 * @return The date.
 */
function at( year: number, month: number, day: number ): Date {
	return new Date( year, month - 1, day, 0, 0, 0, 0 );
}

/**
 * The last instant of a day, the shape preset ranges use for `to`.
 *
 * @param year  - Full year.
 * @param month - 1-indexed month.
 * @param day   - Day of month.
 * @return The end of that day.
 */
function endOf( year: number, month: number, day: number ): Date {
	return new Date( year, month - 1, day, 23, 59, 59, 999 );
}

describe( 'formatDateRangeLong', () => {
	it( 'returns an empty string when the range is incomplete', () => {
		expect( formatDateRangeLong() ).toBe( '' );
		expect( formatDateRangeLong( {} ) ).toBe( '' );
		expect( formatDateRangeLong( { from: at( 2026, 7, 21 ) } ) ).toBe( '' );
	} );

	it( 'leads day-scale ranges with the weekday and omits the current year', () => {
		expect(
			formatDateRangeLong(
				{ from: at( 2026, 7, 21 ), to: endOf( 2026, 7, 27 ) },
				{ referenceYear: 2026 }
			)
		).toBe( 'Tuesday, July 21 – Monday, July 27' );
	} );

	it( 'adds the year once a day-scale range leaves the reference year', () => {
		expect(
			formatDateRangeLong(
				{ from: at( 2024, 7, 16 ), to: endOf( 2024, 7, 22 ) },
				{ referenceYear: 2026 }
			)
		).toBe( 'Tuesday, July 16, 2024 – Monday, July 22, 2024' );
	} );

	it( 'adds the year when a day-scale range straddles two years', () => {
		expect(
			formatDateRangeLong(
				{ from: at( 2025, 12, 29 ), to: endOf( 2026, 1, 4 ) },
				{ referenceYear: 2026 }
			)
		).toBe( 'Monday, December 29, 2025 – Sunday, January 4, 2026' );
	} );

	it( 'drops the weekday and always carries the year on month-scale ranges', () => {
		expect(
			formatDateRangeLong(
				{ from: at( 2025, 7, 1 ), to: endOf( 2026, 6, 30 ) },
				{ referenceYear: 2026 }
			)
		).toBe( 'July 1, 2025 – June 30, 2026' );
	} );

	it( 'defaults the reference year to the current one', () => {
		const year = new Date().getFullYear();

		expect(
			formatDateRangeLong( { from: new Date( year, 6, 21 ), to: new Date( year, 6, 27 ) } )
		).not.toMatch( String( year ) );
	} );
} );
