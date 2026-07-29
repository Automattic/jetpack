/**
 * External dependencies
 */
import { setSettings } from '@wordpress/date';
/**
 * Internal dependencies
 */
import { readBestDay } from '../render';

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

/**
 * Read the calendar day the parsed date lands on in a timezone.
 *
 * @param date     - The parsed date.
 * @param timeZone - IANA zone name to read it in.
 * @return The `YYYY-MM-DD` day.
 */
const dayIn = ( date: Date | undefined, timeZone: string ) =>
	date &&
	new Intl.DateTimeFormat( 'en-CA', {
		timeZone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	} ).format( date );

describe( 'readBestDay', () => {
	// `views_best_day` is a calendar day in site time with no offset. Anchoring
	// it anywhere else moves the day once it is rendered in the site's zone.
	it( 'lands on the given day for a site east of UTC', () => {
		siteIn( 'Europe/Amsterdam', 2, 'en-ams-bestday' );

		const date = readBestDay( { views_best_day: '2020-08-18' } );

		expect( dayIn( date, 'Europe/Amsterdam' ) ).toBe( '2020-08-18' );
	} );

	it( 'lands on the given day for a site west of UTC', () => {
		siteIn( 'America/New_York', -5, 'en-nyc-bestday' );

		const date = readBestDay( { views_best_day: '2020-08-18' } );

		expect( dayIn( date, 'America/New_York' ) ).toBe( '2020-08-18' );
	} );

	it( 'rejects the sentinel low-traffic sites send', () => {
		siteIn( 'UTC', 0, 'en-utc-bestday-1' );

		expect( readBestDay( { views_best_day: '-' } ) ).toBeUndefined();
		expect( readBestDay( { views_best_day: '' } ) ).toBeUndefined();
	} );

	it( 'rejects an impossible calendar day', () => {
		siteIn( 'UTC', 0, 'en-utc-bestday-2' );

		expect( readBestDay( { views_best_day: '2020-02-31' } ) ).toBeUndefined();
	} );

	it( 'returns undefined without a summary', () => {
		siteIn( 'UTC', 0, 'en-utc-bestday-3' );

		expect( readBestDay( undefined ) ).toBeUndefined();
	} );
} );
