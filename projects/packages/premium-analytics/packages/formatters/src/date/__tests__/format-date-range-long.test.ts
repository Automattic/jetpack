/**
 * External dependencies
 */
import { TZDate } from '@date-fns/tz';
import { setSettings } from '@wordpress/date';
/**
 * Internal dependencies
 */
import { EN_US_SETTINGS } from '../__fixtures__/wp-date-settings';
import { formatDateRangeLong } from '../format-date-range-long';

/**
 * `date-fns` reads a `TZDate`'s own zone for day boundaries and `dateI18n`
 * renders in the site's; the fixtures pin the site to UTC, so dates are built there.
 */
const TEST_TIMEZONE = 'UTC';

/**
 * Build the first instant of a day, in the site's zone.
 *
 * @param year  - Full year.
 * @param month - 1-indexed month.
 * @param day   - Day of month.
 * @return The date.
 */
function at( year: number, month: number, day: number ): TZDate {
	return new TZDate( year, month - 1, day, 0, 0, 0, 0, TEST_TIMEZONE );
}

/**
 * The last instant of a day, the shape preset ranges use for `to`.
 *
 * @param year  - Full year.
 * @param month - 1-indexed month.
 * @param day   - Day of month.
 * @return The end of that day.
 */
function endOf( year: number, month: number, day: number ): TZDate {
	return new TZDate( year, month - 1, day, 23, 59, 59, 999, TEST_TIMEZONE );
}

/**
 * An instant part-way through a day, for the rolling-window cases.
 *
 * @param year   - Full year.
 * @param month  - 1-indexed month.
 * @param day    - Day of month.
 * @param hour   - Hour of day.
 * @param minute - Minute of hour.
 * @return The date.
 */
function atTime( year: number, month: number, day: number, hour: number, minute = 0 ): TZDate {
	return new TZDate( year, month - 1, day, hour, minute, 0, 0, TEST_TIMEZONE );
}

describe( 'formatDateRangeLong', () => {
	beforeEach( () => {
		setSettings( EN_US_SETTINGS );
	} );

	it( 'returns an empty string when the range is incomplete', () => {
		expect( formatDateRangeLong() ).toBe( '' );
		expect( formatDateRangeLong( {} ) ).toBe( '' );
		expect( formatDateRangeLong( { from: at( 2026, 7, 21 ) } ) ).toBe( '' );
	} );

	it( 'leads a week-scale range with the weekday and omits the current year', () => {
		expect(
			formatDateRangeLong(
				{ from: at( 2026, 7, 21 ), to: endOf( 2026, 7, 27 ) },
				{ referenceYear: 2026 }
			)
		).toBe( 'Tuesday, July 21 – Monday, July 27' );
	} );

	it( 'names a day-aligned single day once instead of repeating it', () => {
		expect(
			formatDateRangeLong(
				{ from: at( 2026, 7, 29 ), to: endOf( 2026, 7, 29 ) },
				{ referenceYear: 2026 }
			)
		).toBe( 'Wednesday, July 29' );
	} );

	it( 'names a rolling 24-hour window by the day it ends on', () => {
		// The window straddles two calendar days; the day the reading is taken on
		// is the one it is about.
		expect(
			formatDateRangeLong(
				{
					from: atTime( 2026, 7, 28, 14, 30 ),
					to: atTime( 2026, 7, 29, 14, 30 ),
				},
				{ referenceYear: 2026 }
			)
		).toBe( 'Wednesday, July 29' );
	} );

	it( 'keeps both ends for a window longer than a day', () => {
		// 36 hours is still hour-scale, but no single date covers it.
		expect(
			formatDateRangeLong(
				{
					from: atTime( 2026, 7, 28, 6 ),
					to: atTime( 2026, 7, 29, 18 ),
				},
				{ referenceYear: 2026 }
			)
		).toBe( 'Tuesday, July 28 – Wednesday, July 29' );
	} );

	it( 'drops the weekday once the range runs longer than a week', () => {
		// Past a week the weekday says where the window starts, not what it
		// covers, and costs two words in front of each date.
		expect(
			formatDateRangeLong(
				{ from: at( 2026, 7, 21 ), to: endOf( 2026, 8, 19 ) },
				{ referenceYear: 2026 }
			)
		).toBe( 'July 21 – August 19' );
	} );

	it( 'keeps the weekday right up to a week', () => {
		expect(
			formatDateRangeLong(
				{ from: at( 2026, 7, 22 ), to: endOf( 2026, 7, 28 ) },
				{ referenceYear: 2026 }
			)
		).toBe( 'Wednesday, July 22 – Tuesday, July 28' );

		expect(
			formatDateRangeLong(
				{ from: at( 2026, 7, 21 ), to: endOf( 2026, 7, 28 ) },
				{ referenceYear: 2026 }
			)
		).toBe( 'July 21 – July 28' );
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

	it( 'adds the year once a weekday-less range leaves the reference year', () => {
		expect(
			formatDateRangeLong(
				{ from: at( 2024, 7, 21 ), to: endOf( 2024, 8, 19 ) },
				{ referenceYear: 2026 }
			)
		).toBe( 'July 21, 2024 – August 19, 2024' );
	} );

	it( 'drops the weekday on month-scale ranges, which pick up the year on their own', () => {
		expect(
			formatDateRangeLong(
				{ from: at( 2025, 7, 1 ), to: endOf( 2026, 6, 30 ) },
				{ referenceYear: 2026 }
			)
		).toBe( 'July 1, 2025 – June 30, 2026' );
	} );

	it( 'keeps the calendar shape for a running year still inside its first week', () => {
		// Measured, this is a 3-day window and would lead with weekdays and drop
		// the year.
		const range = { from: at( 2026, 1, 1 ), to: endOf( 2026, 1, 3 ) };

		expect( formatDateRangeLong( range, { referenceYear: 2026, calendarScale: true } ) ).toBe(
			'January 1, 2026 – January 3, 2026'
		);
		expect( formatDateRangeLong( range, { referenceYear: 2026 } ) ).toBe(
			'Thursday, January 1 – Saturday, January 3'
		);
	} );

	it( 'defaults the reference year to the current one', () => {
		const year = new Date().getFullYear();

		expect(
			formatDateRangeLong( { from: at( year, 7, 21 ), to: endOf( year, 7, 27 ) } )
		).not.toMatch( String( year ) );
	} );
} );
