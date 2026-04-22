/* eslint-disable jsdoc/require-param-description, jsdoc/require-returns */

import { dateI18n } from '@wordpress/date';
import { __, sprintf } from '@wordpress/i18n';
import { useSiteData } from './use-site-data';

const HOUR_MS = 3_600_000;

const formatWithTimeZone = (
	date: Date,
	locale: string,
	options: Intl.DateTimeFormatOptions,
	timezoneString?: string,
	gmtOffset?: number
): string => {
	if ( isNaN( date.getTime() ) ) {
		return '';
	}
	if ( timezoneString ) {
		return new Intl.DateTimeFormat( locale, { ...options, timeZone: timezoneString } ).format(
			date
		);
	}
	if ( typeof gmtOffset === 'number' ) {
		const shifted = new Date( date.getTime() + gmtOffset * HOUR_MS );
		return new Intl.DateTimeFormat( locale, { ...options, timeZone: 'UTC' } ).format( shifted );
	}
	return new Intl.DateTimeFormat( locale, options ).format( date );
};

const formatYmd = ( date: Date, timezoneString?: string, gmtOffset?: number ): string => {
	if ( timezoneString ) {
		return String( dateI18n( 'Y-m-d', date, timezoneString ) );
	}
	if ( typeof gmtOffset === 'number' ) {
		const shifted = new Date( date.getTime() + gmtOffset * HOUR_MS );
		const y = shifted.getUTCFullYear();
		const m = String( shifted.getUTCMonth() + 1 ).padStart( 2, '0' );
		const d = String( shifted.getUTCDate() ).padStart( 2, '0' );
		return `${ y }-${ m }-${ d }`;
	}
	return String( dateI18n( 'Y-m-d', date ) );
};

export interface FormatOptions extends Intl.DateTimeFormatOptions {
	lowercaseCalendarLabel?: boolean;
}

/**
 * Format a timestamp in the site's local timezone, with a "today"
 * calendar-relative label for dates that fall on the current site day.
 *
 * Adapted from `client/dashboard/components/formatted-time/index.ts`.
 * @param timestamp
 * @param formatOptions
 */
export function useFormattedTime(
	timestamp: string,
	formatOptions: FormatOptions = { dateStyle: 'medium', timeStyle: 'short' }
): string {
	const { locale, timezoneString, gmtOffset } = useSiteData();
	const tz = timezoneString || undefined;
	const { lowercaseCalendarLabel, ...intlOptions } = formatOptions;

	const date = new Date( timestamp );
	if ( isNaN( date.getTime() ) ) {
		return '';
	}

	const formatted = formatWithTimeZone( date, locale, intlOptions, tz, gmtOffset );

	if ( intlOptions.dateStyle ) {
		return formatted;
	}

	const todayYmd = formatYmd( new Date(), tz, gmtOffset );
	const dateYmd = formatYmd( date, tz, gmtOffset );

	if ( dateYmd === todayYmd ) {
		if ( intlOptions.timeStyle ) {
			if ( lowercaseCalendarLabel ) {
				return sprintf(
					// translators: %s is a formatted time of day, e.g. "7:00 AM".
					__( 'today at %s', 'jetpack-backup-pkg' ),
					formatted
				);
			}
			return sprintf(
				// translators: %s is a formatted time of day, e.g. "7:00 AM".
				__( 'Today at %s', 'jetpack-backup-pkg' ),
				formatted
			);
		}
		// Bare "Today" label. Callers that want a lowercase form always
		// pair it with a timeStyle and hit the sprintf branch above —
		// keeping this branch in one translation avoids an optimizer
		// pattern that merges the two __() calls into a ternary.
		return __( 'Today', 'jetpack-backup-pkg' );
	}

	return formatWithTimeZone( date, locale, { ...intlOptions, dateStyle: 'long' }, tz, gmtOffset );
}
