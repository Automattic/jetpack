/**
 * External dependencies
 */
import { dateI18n, getSettings } from '@wordpress/date';
/**
 * Internal dependencies
 */
import { intlLocale } from './elide-range';
import { hasToken, withShortMonth, withWeekday, withoutDay, withoutYear } from './php-format';

/** Fixed because this format backs form values and query parameters. */
const ISO_FORMAT = 'Y-m-d';

const YEAR_FORMAT = 'Y';

/** Named formats derived from the site format or fixed for machine-readable uses. */
export type DateFormatName =
	| 'medium'
	| 'compact'
	| 'compactNoYear'
	| 'short'
	| 'monthYear'
	| 'year'
	| 'iso'
	| 'full'
	| 'fullNoYear'
	| 'dateTime';

/**
 * An instant to render, such as a `TZDate` or a timestamp.
 *
 * Narrower than `dateI18n` accepts: a date-only string is read as browser-local
 * midnight, so parse site-local strings with `parseSiteDateTime` first.
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

	if ( name === 'monthYear' ) {
		return withoutDay( siteFormat ) || siteFormat;
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
 * Month and weekday names come from WordPress's translation tables and the
 * ordering from `date_format`, so dates match wp-admin rather than the browser.
 *
 * @param date - The instant to render. See `DateInput`.
 * @param name - Named format. Defaults to `'medium'`.
 * @return The formatted date.
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
 * Return a full weekday name in the site's locale, from a Monday-first index.
 *
 * Stats payloads and weekday buckets count from Monday; the WordPress locale
 * table counts from Sunday. Keeping that offset here means a caller cannot get
 * it the wrong way round.
 *
 * @param weekday - Monday-based weekday index (`0` = Monday).
 * @return The localized full weekday name.
 */
export const formatMondayFirstWeekday = ( weekday: number ): string =>
	formatWeekday( ( weekday + 1 ) % 7 );

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
 * `Intl` supplies the unit a locale attaches to a bare hour (`19 Uhr`, `19時`),
 * which no subset of `time_format` spells out. Only the clock's length and the
 * meridiem's case are read from `time_format` — those are the site's choice.
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
