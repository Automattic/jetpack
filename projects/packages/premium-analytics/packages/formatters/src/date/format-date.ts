/**
 * External dependencies
 */
import { dateI18n, getSettings } from '@wordpress/date';
/**
 * Internal dependencies
 */
import { intlLocale } from './elide-range';
import { hasToken, withShortMonth, withWeekday, withoutYear } from './php-format';

/** Fixed because this format backs form values and query parameters. */
const ISO_FORMAT = 'Y-m-d';

const YEAR_FORMAT = 'Y';

/** Named formats derived from the site format or fixed for machine-readable uses. */
export type DateFormatName =
	| 'medium'
	| 'compact'
	| 'compactNoYear'
	| 'short'
	| 'year'
	| 'iso'
	| 'full'
	| 'fullNoYear'
	| 'dateTime';

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

	if ( name === 'dateTime' ) {
		return `${ siteFormat } ${ getSettings().formats.time }`;
	}

	if ( name === 'compact' ) {
		return withShortMonth( siteFormat );
	}

	if ( name === 'compactNoYear' ) {
		return withShortMonth( withoutYearFormat );
	}

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
 * formatDate( date )                  // 'June 21, 2025'           — or '21 de junio de 2025'
 * formatDate( date, 'compact' )       // 'Jun 21, 2025'            — or '21 de jun de 2025'
 * formatDate( date, 'compactNoYear' ) // 'Jun 21'                  — or '21 de jun'
 * formatDate( date, 'short' )         // 'June 21'                 — or '21 de junio'
 * formatDate( date, 'full' )          // 'Saturday, June 21, 2025' — or 'sábado, 21 de junio de 2025'
 */
export const formatDate = ( date: DateInput, name: DateFormatName = 'medium' ): string =>
	dateI18n( formatFor( name ), date );

/**
 * Return a full weekday name in the site's locale.
 *
 * @param weekday - Sunday-based weekday index (`0` = Sunday).
 * @return The localized full weekday name.
 */
export const formatWeekday = ( weekday: number ): string => {
	const weekdays = getSettings().l10n.weekdays as string[];

	return weekdays[ weekday ] ?? '';
};

/**
 * Return a month name in the site's locale.
 *
 * Read from WordPress's own translation tables, like `formatWeekday`, so the
 * months match the rest of wp-admin rather than the browser's locale.
 *
 * @param month         - Zero-based month index (`0` = January).
 * @param options       - Naming options.
 * @param options.short - Pick the abbreviated name.
 * @return The localized month name.
 */
export const formatMonth = ( month: number, options: { short?: boolean } = {} ): string => {
	const { l10n } = getSettings();
	const months = ( options.short ? l10n.monthsShort : l10n.months ) as string[];

	return months?.[ month ] ?? '';
};

/** 12-hour clock tokens, zero-padded and not. */
const TWELVE_HOUR_TOKENS = new Set( [ 'g', 'h' ] );

/** Zero-padded hour tokens for 12- and 24-hour clocks. */
const PADDED_HOUR_TOKENS = new Set( [ 'h', 'H' ] );

/** Lowercase and uppercase meridiem tokens. */
const MERIDIEM_TOKENS = new Set( [ 'a', 'A' ] );

/** The lowercase meridiem token; `A` is its uppercase counterpart. */
const LOWERCASE_MERIDIEM_TOKENS = new Set( [ 'a' ] );

/**
 * Render an hour of the day the way the site's locale names one.
 *
 * `Intl` is asked for the hour rather than an hour-only pattern being derived
 * from `time_format`, which names minutes these buckets never carry. It also
 * supplies the unit a locale attaches to a bare hour (`19 Uhr`, `19時`), which
 * no subset of the site's format spells out. Only the clock's length and the
 * meridiem's case are still read from `time_format`: those are the site's
 * choice, not the locale's.
 *
 * @param hour - Site-local hour, 0–23.
 * @return The localized hour label, e.g. `7 pm`, `19`, or `19時`.
 */
export const formatHourOfDay = ( hour: number ): string => {
	const timeFormat = getSettings().formats.time;
	const isTwelveHour = hasToken( timeFormat, TWELVE_HOUR_TOKENS );
	const isPadded = hasToken( timeFormat, PADDED_HOUR_TOKENS );
	const hasMeridiem = hasToken( timeFormat, MERIDIEM_TOKENS );
	// A UTC date read back in UTC: the bucket is already site-local, and
	// converting it again would move it.
	const date = new Date( Date.UTC( 2001, 0, 1, hour ) );
	const locale = intlLocale();

	if ( ! locale ) {
		let hourToken = isPadded ? 'H' : 'G';

		if ( isTwelveHour ) {
			hourToken = isPadded ? 'h' : 'g';
		}

		const meridiemToken = hasMeridiem
			? ` ${ hasToken( timeFormat, LOWERCASE_MERIDIEM_TOKENS ) ? 'a' : 'A' }`
			: '';

		return dateI18n( `${ hourToken }${ meridiemToken }`, date, '+00:00' );
	}

	const parts = new Intl.DateTimeFormat( locale, {
		hour: '2-digit',
		// `hour12` leaves the cycle to the locale, which can answer midnight as
		// `24`; the explicit cycles do not.
		hourCycle: isTwelveHour ? 'h12' : 'h23',
		timeZone: 'UTC',
	} ).formatToParts( date );

	const lowercaseMeridiem = hasToken( timeFormat, LOWERCASE_MERIDIEM_TOKENS );
	const unpaddedHour = new Intl.NumberFormat( locale, { useGrouping: false } ).format(
		isTwelveHour ? hour % 12 || 12 : hour
	);

	return parts
		.filter( part => hasMeridiem || part.type !== 'dayPeriod' )
		.map( part => {
			if ( part.type === 'hour' && ! isPadded ) {
				return unpaddedHour;
			}

			return part.type === 'dayPeriod' && lowercaseMeridiem ? part.value.toLowerCase() : part.value;
		} )
		.join( '' )
		.trim();
};
