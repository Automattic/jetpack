/**
 * External dependencies
 */
import { dateI18n, getSettings } from '@wordpress/date';
/**
 * Internal dependencies
 */
import { withoutYear } from './php-format';

/**
 * Machine-readable date. Fixed on purpose: it backs form values and query
 * parameters, so it must not follow the site's display format.
 */
const ISO_FORMAT = 'Y-m-d';

/** Year on its own. No ordering is involved, so no site format is needed. */
const YEAR_FORMAT = 'Y';

/**
 * Named date formats.
 *
 * | Name   | Purpose                              | en_US site    | es_ES site         |
 * |--------|--------------------------------------|---------------|--------------------|
 * | medium | Default. The site's own date format. | June 21, 2025 | 21 de junio de 2025|
 * | short  | The site format minus its year.      | June 21       | 21 de junio        |
 * | year   | Year alone.                          | 2025          | 2025               |
 * | iso    | Machine-readable. Never localized.   | 2025-06-21    | 2025-06-21         |
 */
export type DateFormatName = 'medium' | 'short' | 'year' | 'iso';

/**
 * Date input accepted by `dateI18n`.
 *
 * Pass a value that already carries its offset — a `TZDate` from
 * `@jetpack-premium-analytics/datetime`, a timestamp, or a string with an
 * explicit offset. A bare `YYYY-MM-DD` is read as browser-local midnight and
 * then shifted into the site's timezone, which lands on the previous day for
 * any visitor ahead of the site.
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
