/**
 * External dependencies
 */
import { setSettings } from '@wordpress/date';
/**
 * Internal dependencies
 */
import { formatLegendLabels } from '../format-legend-labels';
import type { ReportParams } from '@jetpack-premium-analytics/data';

/**
 * Install date settings for a site in a given timezone.
 *
 * @param timeZone - IANA zone name.
 * @param offset   - Offset in hours, as WordPress reports it.
 * @param locale   - Unique moment locale name for the fixture.
 */
const siteIn = ( timeZone: string, offset: number, locale: string ) =>
	setSettings( {
		l10n: {
			locale,
			months: [
				'January',
				'February',
				'March',
				'April',
				'May',
				'June',
				'July',
				'August',
				'September',
				'October',
				'November',
				'December',
			],
			monthsShort: [
				'Jan',
				'Feb',
				'Mar',
				'Apr',
				'May',
				'Jun',
				'Jul',
				'Aug',
				'Sep',
				'Oct',
				'Nov',
				'Dec',
			],
			weekdays: [ 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday' ],
			weekdaysShort: [ 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat' ],
			meridiem: { am: 'am', AM: 'AM', pm: 'pm', PM: 'PM' },
			relative: { future: 'in %s', past: '%s ago' },
			startOfWeek: 0 as const,
		},
		formats: {
			time: 'g:i a',
			date: 'F j, Y',
			datetime: 'F j, Y g:i a',
			datetimeAbbreviated: 'M j, Y g:i a',
		},
		timezone: { offset, offsetFormatted: String( offset ), string: timeZone, abbr: '' },
	} );

describe( 'formatLegendLabels', () => {
	// A date-only param has no offset of its own. Read as UTC it lands on the
	// previous day for every site west of Greenwich.
	it( 'keeps date-only params on their own calendar day for a site west of UTC', () => {
		siteIn( 'America/New_York', -5, 'en-nyc-test' );

		const labels = formatLegendLabels( {
			from: '2026-01-01',
			to: '2026-01-31',
			compare_from: '2025-12-01',
			compare_to: '2025-12-31',
			interval: 'day',
		} as ReportParams );

		expect( labels.primary ).toBe( 'January 1, 2026 – January 31, 2026' );
		expect( labels.comparison ).toBe( 'December 1, 2025 – December 31, 2025' );
	} );

	it( 'keeps date-only params on their own calendar day for a site east of UTC', () => {
		siteIn( 'Asia/Taipei', 8, 'en-tpe-test' );

		const labels = formatLegendLabels( {
			from: '2026-01-01',
			to: '2026-01-31',
			interval: 'day',
		} as ReportParams );

		expect( labels.primary ).toBe( 'January 1, 2026 – January 31, 2026' );
	} );

	it( 'honours the offset a full ISO param already carries', () => {
		siteIn( 'Europe/Amsterdam', 2, 'en-ams-test' );

		const labels = formatLegendLabels( {
			from: '2026-06-29T00:00:00.000+02:00',
			to: '2026-07-28T23:59:59.999+02:00',
			interval: 'day',
		} as ReportParams );

		expect( labels.primary ).toBe( 'June 29, 2026 – July 28, 2026' );
	} );

	it( 'falls back to the generic comparison label without comparison params', () => {
		siteIn( 'UTC', 0, 'en-utc-test' );

		const labels = formatLegendLabels( {
			from: '2026-01-01',
			to: '2026-01-31',
			interval: 'day',
		} as ReportParams );

		expect( labels.comparison ).toBe( 'Previous period' );
	} );
} );
