import { dateI18n, getSettings } from '@wordpress/date';
import { _x, sprintf } from '@wordpress/i18n';

type DateInput = Parameters< typeof dateI18n >[ 1 ];

// `formats.date` and `formats.time` follow Settings > General.
// `formats.datetime` is a translation, so it is not used.

/**
 * A date and time in the site's own formats.
 *
 * @param value    - The instant to format.
 * @param timezone - A UTC offset such as `-0300`; omitted, the site's own timezone.
 * @return The formatted date and time.
 */
export function formatDateTime( value: DateInput, timezone?: string ): string {
	return sprintf(
		/* translators: 1: a date, 2: a time of day. */
		_x( '%1$s %2$s', 'date and time', 'jetpack-backup-pkg' ),
		dateI18n( getSettings().formats.date, value, timezone ),
		formatTime( value, timezone )
	);
}

/**
 * A date in the site's own format.
 *
 * @param value - The instant to format.
 * @return The formatted date.
 */
export function formatDate( value: DateInput ): string {
	return dateI18n( getSettings().formats.date, value );
}

/**
 * The site's time-of-day format string.
 *
 * @return The format, in PHP date syntax.
 */
export function getTimeFormat(): string {
	return getSettings().formats.time;
}

/**
 * A time of day in the site's own format.
 *
 * @param value    - The instant to format.
 * @param timezone - A UTC offset such as `-0300`; omitted, the site's own timezone.
 * @return The formatted time.
 */
export function formatTime( value: DateInput, timezone?: string ): string {
	return dateI18n( getTimeFormat(), value, timezone );
}

/**
 * A short month and day. The site settings have no such format, so it is translatable.
 *
 * @param value - The instant to format.
 * @return The formatted month and day.
 */
export function formatShortDate( value: DateInput ): string {
	return dateI18n(
		// translators: Short month and day format, see https://www.php.net/manual/datetime.format.php
		_x( 'M j', 'short month and day date format', 'jetpack-backup-pkg' ),
		value
	);
}
