import { dateI18n } from '@wordpress/date';
import { __, _x } from '@wordpress/i18n';

type DateInput = Parameters< typeof dateI18n >[ 1 ];

// Translatable like WordPress core's own formats, so English stays compact and locales can change it.

/**
 * A date and time in the dashboard's compact format.
 *
 * @param value    - The instant to format.
 * @param timezone - A UTC offset such as `-0300`; omitted, the site's own timezone.
 * @return The formatted date and time.
 */
export function formatDateTime( value: DateInput, timezone?: string ): string {
	return dateI18n(
		// translators: Date and time format, see https://www.php.net/manual/datetime.format.php
		__( 'M j, Y, g:i A', 'jetpack-backup-pkg' ),
		value,
		timezone
	);
}

/**
 * A date in the dashboard's compact format.
 *
 * @param value - The instant to format.
 * @return The formatted date.
 */
export function formatDate( value: DateInput ): string {
	return dateI18n(
		// translators: Date format, see https://www.php.net/manual/datetime.format.php
		__( 'M j, Y', 'jetpack-backup-pkg' ),
		value
	);
}

/**
 * The time-of-day format string.
 *
 * @return The format, in PHP date syntax.
 */
export function getTimeFormat(): string {
	// translators: Time format, see https://www.php.net/manual/datetime.format.php
	return __( 'g:i A', 'jetpack-backup-pkg' );
}

/**
 * A time of day in the dashboard's compact format.
 *
 * @param value    - The instant to format.
 * @param timezone - A UTC offset such as `-0300`; omitted, the site's own timezone.
 * @return The formatted time.
 */
export function formatTime( value: DateInput, timezone?: string ): string {
	return dateI18n( getTimeFormat(), value, timezone );
}

/**
 * A short month and day.
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
