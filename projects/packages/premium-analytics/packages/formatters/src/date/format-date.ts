/**
 * External dependencies
 */
import { dateI18n, getSettings } from '@wordpress/date';
/**
 * Internal dependencies
 */
import { withWeekday, withoutYear } from './php-format';

/** Fixed because this format backs form values and query parameters. */
const ISO_FORMAT = 'Y-m-d';

const YEAR_FORMAT = 'Y';

/** Named formats derived from the site format or fixed for machine-readable uses. */
export type DateFormatName = 'medium' | 'short' | 'year' | 'iso' | 'full' | 'fullNoYear';

/**
 * An instant to render, such as a `TZDate` or a timestamp.
 *
 * Narrower than what `dateI18n` accepts, to keep strings out: a date-only
 * string such as `'2026-01-01'` is read as browser-local midnight, so it
 * renders as the previous day for anyone ahead of the site. Parse site-local
 * strings with `parseSiteDateTime` first.
 */
type DateInput = Date | number;

/**
 * Resolve a named format to the PHP format string for the current site.
 *
 * @param name - The named format.
 * @return PHP `date()` format string.
 */
function formatFor( name: DateFormatName ): string {
	if ( name === 'iso' ) {
		return ISO_FORMAT;
	}

	if ( name === 'year' ) {
		return YEAR_FORMAT;
	}

	const siteFormat = getSettings().formats.date;
	const withoutYearFormat = withoutYear( siteFormat ) || siteFormat;

	if ( name === 'short' ) {
		return withoutYearFormat;
	}

	if ( name === 'full' ) {
		return withWeekday( siteFormat );
	}

	if ( name === 'fullNoYear' ) {
		return withWeekday( withoutYearFormat );
	}

	return siteFormat;
}

/**
 * Format a date in the site's locale and timezone.
 *
 * Month and weekday names come from WordPress's own translation tables, and
 * the ordering from the site's `date_format` option, so dates match the rest
 * of wp-admin rather than the browser's locale.
 *
 * @param date - The instant to render. See `DateInput`.
 * @param name - Named format. Defaults to `'medium'`.
 * @return The formatted date.
 *
 * @example
 * formatDate( date )           // 'June 21, 2025'           — or '21 de junio de 2025'
 * formatDate( date, 'short' )  // 'June 21'                 — or '21 de junio'
 * formatDate( date, 'full' )   // 'Saturday, June 21, 2025' — or 'sábado, 21 de junio de 2025'
 */
export const formatDate = ( date: DateInput, name: DateFormatName = 'medium' ): string =>
	dateI18n( formatFor( name ), date );
