/**
 * Minimal WordPress PHP-style date format token formatter.
 *
 * WordPress stores its `date_format` Settings option as a PHP `date()` token
 * string (`F j, Y`, `Y-m-d`, `d/m/Y`, etc.) — the result card has to honour
 * that string verbatim, not just `toLocaleDateString`'s `{ year, month, day }`
 * canon. This module exists because the Interactivity API view bundle rejects
 * imports from `@wordpress/i18n` / `@wordpress/date` (see the file-level
 * comment in `result-utils.js`), so neither `dateI18n()` nor moment.js are
 * reachable from the search blocks store.
 *
 * Token coverage: every PHP `date()` letter likely to appear in a WP
 * `date_format` setting (`d D j l N S w F m M n Y y L o H h G g i s a A`),
 * plus `\` as the literal-escape character. Tokens that resolve to a month
 * or weekday name (`F`, `M`, `l`, `D`) are sourced from `Intl.DateTimeFormat`
 * for the seeded blog locale, so the output follows the browser's ICU data
 * rather than WordPress's own translation tables — this is the closest
 * faithful approximation reachable from inside the IAPI runtime. Note that
 * locale-specific abbreviation conventions still apply: e.g. German short
 * months render as "Apr." rather than the PHP-default "Apr", matching the
 * behavior of `dateI18n()` on the same site.
 *
 * Dates are read in UTC to keep result cards stable regardless of the
 * viewer's timezone — the v1.3 Jetpack Search API returns post `date` in UTC,
 * and the result card represents the published date, not a localised wall
 * clock.
 */

const intlFormatters = new Map();

/**
 * Cached `Intl.DateTimeFormat` resolver keyed by `locale|options-shape` so
 * each unique combination is constructed at most once for the page.
 *
 * @param {string} locale  - BCP47 locale tag.
 * @param {object} options - `Intl.DateTimeFormat` options.
 * @return {Intl.DateTimeFormat|null} Formatter, or null if the locale is malformed.
 */
function getIntlFormatter( locale, options ) {
	const key = `${ locale }|${ Object.entries( options ).flat().join( ',' ) }`;
	let formatter = intlFormatters.get( key );
	if ( formatter ) {
		return formatter;
	}
	try {
		formatter = new Intl.DateTimeFormat( locale, { timeZone: 'UTC', ...options } );
	} catch {
		return null;
	}
	intlFormatters.set( key, formatter );
	return formatter;
}

/**
 * Format a Date as a single locale-aware piece (e.g. `month: 'long'` → "April",
 * `weekday: 'short'` → "Mon"). Falls back to the equivalent English string when
 * the locale tag is malformed so the output never silently becomes empty.
 *
 * @param {Date}   date     - UTC date to format.
 * @param {string} locale   - BCP47 locale tag.
 * @param {object} options  - `Intl.DateTimeFormat` options (single component).
 * @param {string} fallback - Value to return when the formatter can't be built.
 * @return {string} Formatted piece.
 */
function intlPart( date, locale, options, fallback ) {
	const formatter = getIntlFormatter( locale, options );
	return formatter ? formatter.format( date ) : fallback;
}

const ENGLISH_LONG_MONTHS = [
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

const ENGLISH_SHORT_MONTHS = [
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
];

const ENGLISH_LONG_DAYS = [
	'Sunday',
	'Monday',
	'Tuesday',
	'Wednesday',
	'Thursday',
	'Friday',
	'Saturday',
];

const ENGLISH_SHORT_DAYS = [ 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat' ];

/**
 * PHP `S` token: English ordinal suffix for a 1–31 day-of-month value. WP keeps
 * this English even in non-English locales (PHP `date()` itself is not locale
 * aware), so we match that behaviour rather than localising via Intl.
 *
 * @param {number} day - 1–31 day-of-month.
 * @return {string} 'st' | 'nd' | 'rd' | 'th'.
 */
function ordinalSuffix( day ) {
	if ( day >= 11 && day <= 13 ) {
		return 'th';
	}
	switch ( day % 10 ) {
		case 1:
			return 'st';
		case 2:
			return 'nd';
		case 3:
			return 'rd';
		default:
			return 'th';
	}
}

/**
 * PHP `o` token: the ISO-8601 week-numbering year. Differs from `Y` for the
 * last few days of December and first few days of January when those dates
 * fall in an ISO week belonging to the neighbouring year.
 *
 * @param {Date} d - UTC date.
 * @return {number} ISO week-numbering year.
 */
function isoWeekYear( d ) {
	const tmp = new Date( Date.UTC( d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() ) );
	// Shift to the Thursday of the ISO week — that day always belongs to the
	// correct ISO year.
	const dayNum = tmp.getUTCDay() || 7;
	tmp.setUTCDate( tmp.getUTCDate() + 4 - dayNum );
	return tmp.getUTCFullYear();
}

/**
 * Two-digit zero-padded string for a non-negative integer.
 *
 * @param {number} n - Integer in the 0–99 range coming out of `Date.getUTC*()`.
 * @return {string} Two-character zero-padded representation.
 */
function pad2( n ) {
	return String( n ).padStart( 2, '0' );
}

/**
 * Replace a single PHP `date()` token with its formatted value. Returns the
 * raw token character unchanged when it isn't one of the supported tokens so
 * an unrecognised letter shows up in the output rather than getting silently
 * dropped — easier to diagnose than a confusingly truncated date.
 *
 * @param {string} token  - Single ASCII letter token.
 * @param {Date}   date   - UTC date.
 * @param {string} locale - BCP47 locale for month / day names.
 * @return {string} Replacement piece.
 */
function replaceToken( token, date, locale ) {
	switch ( token ) {
		case 'd':
			return pad2( date.getUTCDate() );
		case 'D':
			return intlPart( date, locale, { weekday: 'short' }, ENGLISH_SHORT_DAYS[ date.getUTCDay() ] );
		case 'j':
			return String( date.getUTCDate() );
		case 'l':
			return intlPart( date, locale, { weekday: 'long' }, ENGLISH_LONG_DAYS[ date.getUTCDay() ] );
		case 'N':
			return String( ( ( date.getUTCDay() + 6 ) % 7 ) + 1 );
		case 'S':
			return ordinalSuffix( date.getUTCDate() );
		case 'w':
			return String( date.getUTCDay() );
		case 'F':
			return intlPart( date, locale, { month: 'long' }, ENGLISH_LONG_MONTHS[ date.getUTCMonth() ] );
		case 'm':
			return pad2( date.getUTCMonth() + 1 );
		case 'M':
			return intlPart(
				date,
				locale,
				{ month: 'short' },
				ENGLISH_SHORT_MONTHS[ date.getUTCMonth() ]
			);
		case 'n':
			return String( date.getUTCMonth() + 1 );
		case 'Y':
			return String( date.getUTCFullYear() );
		case 'y':
			return pad2( date.getUTCFullYear() % 100 );
		case 'L': {
			const year = date.getUTCFullYear();
			return ( year % 4 === 0 && year % 100 !== 0 ) || year % 400 === 0 ? '1' : '0';
		}
		case 'o':
			return String( isoWeekYear( date ) );
		case 'H':
			return pad2( date.getUTCHours() );
		case 'h':
			return pad2( date.getUTCHours() % 12 || 12 );
		case 'G':
			return String( date.getUTCHours() );
		case 'g':
			return String( date.getUTCHours() % 12 || 12 );
		case 'i':
			return pad2( date.getUTCMinutes() );
		case 's':
			return pad2( date.getUTCSeconds() );
		case 'a':
			return date.getUTCHours() < 12 ? 'am' : 'pm';
		case 'A':
			return date.getUTCHours() < 12 ? 'AM' : 'PM';
		default:
			return token;
	}
}

/**
 * Format a Date according to a PHP `date()`-style format string, using the
 * given BCP47 locale for month / day names.
 *
 * Each character of `format` is interpreted in turn: a backslash escapes the
 * following character so it appears verbatim (`\Y` renders the letter `Y`,
 * matching PHP's `date()` semantics), recognised tokens are substituted via
 * `replaceToken`, and any other character is passed through unchanged.
 *
 * @param {Date}   date   - UTC date.
 * @param {string} format - PHP `date()` token string.
 * @param {string} locale - BCP47 locale tag.
 * @return {string} Formatted date.
 */
export function formatWpDate( date, format, locale = 'en-US' ) {
	let out = '';
	for ( let i = 0; i < format.length; i++ ) {
		const ch = format[ i ];
		if ( ch === '\\' && i + 1 < format.length ) {
			out += format[ ++i ];
			continue;
		}
		out += replaceToken( ch, date, locale );
	}
	return out;
}
