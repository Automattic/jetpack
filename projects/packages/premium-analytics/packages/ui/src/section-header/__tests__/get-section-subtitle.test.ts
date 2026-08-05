/**
 * External dependencies
 */
import { TZDate } from '@date-fns/tz';
import { getSettings, setSettings } from '@wordpress/date';
/**
 * Internal dependencies
 */
import { getSectionSubtitle } from '../get-section-subtitle';

/**
 * The zone both frames are pinned to: `date-fns` reads a `TZDate`'s own zone
 * for day boundaries, and `dateI18n` renders in the site's. Production keeps
 * the two in step because the range carries the site's zone.
 */
const TEST_TIMEZONE = 'UTC';

/** Captured before any test installs settings, so repeats do not compound. */
const DEFAULT_SETTINGS = getSettings();

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
 * Build a range inside the current year, so the year never appears and the
 * assertions stay stable whenever the suite runs. The rendered range itself is
 * covered in `format-date-range-long.test.ts`; these tests own the composition.
 *
 * @param days - Length of the range in days.
 * @return A day-aligned range of `days` days.
 */
function currentYearRange( days: number ): { from: TZDate; to: TZDate } {
	const year = new Date().getFullYear();

	return { from: at( year, 6, 1 ), to: endOf( year, 6, days ) };
}

describe( 'getSectionSubtitle', () => {
	beforeEach( () => {
		setSettings( {
			...DEFAULT_SETTINGS,
			formats: { ...DEFAULT_SETTINGS.formats, date: 'F j, Y' },
			timezone: { offset: 0, offsetFormatted: '0', string: TEST_TIMEZONE, abbr: TEST_TIMEZONE },
		} );
	} );

	it( 'returns undefined when the range is incomplete', () => {
		expect( getSectionSubtitle( {} ) ).toBeUndefined();
		expect( getSectionSubtitle( { range: {} } ) ).toBeUndefined();
		expect( getSectionSubtitle( { range: { from: at( 2026, 7, 21 ) } } ) ).toBeUndefined();
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
				range: { from: at( 2025, 7, 1 ), to: endOf( 2026, 6, 30 ) },
			} )
		).toBe( 'July 1, 2025 – June 30, 2026 (12 months)' );
	} );

	it( 'describes a rolling sub-day window in hours', () => {
		expect(
			getSectionSubtitle( {
				range: {
					from: new TZDate( 2026, 6, 28, 14, 30, 0, 0, TEST_TIMEZONE ),
					to: new TZDate( 2026, 6, 29, 14, 30, 0, 0, TEST_TIMEZONE ),
				},
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

	describe( 'the year surface', () => {
		/*
		 * `all-time` and the running year both start on a calendar boundary and
		 * end at the end of today, so the day they are read on decides the unit.
		 * These are one selection each, read on three days: mid-month, on a month
		 * boundary, and on a year boundary.
		 */
		const READ_ON = [
			[ 'mid-month', endOf( 2026, 7, 30 ) ],
			[ 'on the last day of a month', endOf( 2026, 7, 31 ) ],
			[ 'on the last day of a year', endOf( 2026, 12, 31 ) ],
		] as const;

		const ALL_TIME_FROM = at( 2021, 1, 1 );
		const RUNNING_YEAR_FROM = at( 2026, 1, 1 );

		it.each( READ_ON )( 'all-time carries no length when read %s', ( _label, to ) => {
			const subtitle = getSectionSubtitle( {
				range: { from: ALL_TIME_FROM, to },
				presetId: 'all-time',
			} );

			expect( subtitle ).toContain( 'January 1, 2021' );
			expect( subtitle ).not.toMatch( /\(\d/ );
		} );

		it.each( READ_ON )( 'the running year carries no length when read %s', ( _label, to ) => {
			const subtitle = getSectionSubtitle( {
				range: { from: RUNNING_YEAR_FROM, to },
				presetId: 'year-2026',
			} );

			// Both halves hold still: no length, and the calendar shape rather
			// than the weekday-led one a day-scale measurement would pick.
			expect( subtitle ).toContain( 'January 1, 2026' );
			expect( subtitle ).not.toMatch( /\(\d/ );
			expect( subtitle ).not.toMatch( /day/i );
		} );

		it( 'a past year carries no length either, since its label names it', () => {
			expect(
				getSectionSubtitle( {
					range: { from: at( 2025, 1, 1 ), to: endOf( 2025, 12, 31 ) },
					presetId: 'year-2025',
				} )
			).not.toMatch( /\(\d/ );
		} );

		it( 'still measures the same range under any other preset', () => {
			expect(
				getSectionSubtitle( {
					range: { from: ALL_TIME_FROM, to: endOf( 2026, 7, 30 ) },
					presetId: 'custom',
				} )
			).toContain( '(2037 days)' );
		} );

		it( 'measures the running year under a non-year preset, unit and all', () => {
			// The regression this guards: read mid-month the same dates measure in
			// days and lead with the weekday, and on a month boundary they measure
			// in months and carry the year instead.
			expect(
				getSectionSubtitle( {
					range: { from: RUNNING_YEAR_FROM, to: endOf( 2026, 7, 30 ) },
					presetId: 'custom',
				} )
			).toBe( 'Thursday, January 1 – Thursday, July 30 (211 days)' );

			expect(
				getSectionSubtitle( {
					range: { from: RUNNING_YEAR_FROM, to: endOf( 2026, 7, 31 ) },
					presetId: 'custom',
				} )
			).toBe( 'January 1, 2026 – July 31, 2026 (7 months)' );
		} );
	} );
} );
