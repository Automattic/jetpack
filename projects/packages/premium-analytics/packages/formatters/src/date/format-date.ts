/**
 * External dependencies
 */
import { dateI18n, getSettings } from '@wordpress/date';
/**
 * Internal dependencies
 */
import { withoutYear } from './php-format';

/** Fixed because this format backs form values and query parameters. */
const ISO_FORMAT = 'Y-m-d';

const YEAR_FORMAT = 'Y';

/** Named formats derived from the site format or fixed for machine-readable uses. */
export type DateFormatName = 'medium' | 'short' | 'year' | 'iso';

/**
 * Date input accepted by `dateI18n`.
 *
 * Pass an instant, such as a `TZDate`, timestamp, or offset-bearing string.
 * Parse site-local strings with `parseSiteDateTime` first.
 */
type DateInput = Parameters< typeof dateI18n >[ 1 ];

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

	return name === 'short' ? withoutYear( siteFormat ) : siteFormat;
}

/**
 * Format a date in the site's locale and timezone.
 *
 * Month and weekday names come from WordPress's own translation tables, and
 * the ordering from the site's `date_format` option, so dates match the rest
 * of wp-admin rather than the browser's locale.
 *
 * @param date - The date. See `DateInput` on why it must carry an offset.
 * @param name - Named format. Defaults to `'medium'`.
 * @return The formatted date.
 *
 * @example
 * formatDate( date )           // 'June 21, 2025' — or '21 de junio de 2025'
 * formatDate( date, 'short' )  // 'June 21'       — or '21 de junio'
 */
export const formatDate = ( date: DateInput, name: DateFormatName = 'medium' ): string =>
	dateI18n( formatFor( name ), date );
