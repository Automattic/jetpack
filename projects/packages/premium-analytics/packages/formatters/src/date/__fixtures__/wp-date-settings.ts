/**
 * `@wordpress/date` settings fixtures.
 *
 * The formatter reads the site's `date_format` and WordPress's translated
 * month names, so tests drive it by installing real settings rather than by
 * mocking the formatter.
 */

const EN_MONTHS = [
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
];

const ES_MONTHS = [
	'enero',
	'febrero',
	'marzo',
	'abril',
	'mayo',
	'junio',
	'julio',
	'agosto',
	'septiembre',
	'octubre',
	'noviembre',
	'diciembre',
];

/**
 * Build a settings object for a locale.
 *
 * Only the fields the formatter reads vary; the rest mirror what WordPress
 * core sends to the page. The timezone is fixed to UTC so assertions do not
 * depend on the machine running the suite.
 *
 * @param locale     - Moment locale name. Must be unique per fixture, since
 *                   `setSettings` skips redefining a locale it already knows.
 * @param dateFormat - The site's `date_format` option, in PHP tokens.
 * @param months     - Translated month names, January first.
 * @return Settings ready for `setSettings`.
 */
const settingsFor = ( locale: string, dateFormat: string, months: string[] ) => ( {
	l10n: {
		locale,
		months,
		monthsShort: months.map( month => month.slice( 0, 3 ) ),
		weekdays: [ 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday' ],
		weekdaysShort: [ 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat' ],
		meridiem: { am: 'am', AM: 'AM', pm: 'pm', PM: 'PM' },
		relative: { future: 'in %s', past: '%s ago' },
		startOfWeek: 0 as const,
	},
	formats: {
		time: 'g:i a',
		date: dateFormat,
		datetime: `${ dateFormat } g:i a`,
		datetimeAbbreviated: `${ dateFormat } g:i a`,
	},
	timezone: { offset: 0, offsetFormatted: '0', string: 'UTC', abbr: 'UTC' },
} );

/** A site left on the US English default. */
export const EN_US_SETTINGS = settingsFor( 'en-us-test', 'F j, Y', EN_MONTHS );

/**
 * A Spanish site. Its `date_format` puts the day first and spells "de" with
 * escaped literals (`\d\e`), which double as the day and timezone tokens.
 */
export const ES_ES_SETTINGS = settingsFor( 'es-es-test', 'j \\d\\e F \\d\\e Y', ES_MONTHS );

/**
 * Build a UTC date, matching the fixtures' timezone so no day shift is in play.
 *
 * @param year  - Full year.
 * @param month - 1-based month.
 * @param day   - Day of month.
 * @return The date.
 */
export const utcDate = ( year: number, month: number, day: number ): Date =>
	new Date( Date.UTC( year, month - 1, day ) );
