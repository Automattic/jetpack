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
} );
