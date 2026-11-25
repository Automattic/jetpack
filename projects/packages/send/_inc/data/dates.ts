import { date as phpDate, dateI18n, getSettings, gmdateI18n } from '@wordpress/date';
import { __, _n, sprintf } from '@wordpress/i18n';

const DAY_MS = 86400000;
const YMD = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Today in the site's timezone, as the server counts days.
 *
 * @return Site-local `Y-m-d`.
 */
export function siteToday(): string {
	return phpDate( 'Y-m-d' );
}

/**
 * A `Y-m-d` day as UTC milliseconds at its midnight, or null when it isn't a real day.
 *
 * @param ymd - The day.
 * @return Milliseconds, or null.
 */
function dayMs( ymd: string ): number | null {
	const parts = YMD.exec( ymd );
	if ( ! parts ) {
		return null;
	}
	const ms = Date.UTC( Number( parts[ 1 ] ), Number( parts[ 2 ] ) - 1, Number( parts[ 3 ] ) );
	// Date.UTC rolls 2026-02-31 into March, so a real day must survive the round trip.
	return new Date( ms ).toISOString().slice( 0, 10 ) === ymd ? ms : null;
}

/**
 * Whether a value is a real calendar day written as `Y-m-d`.
 *
 * @param value - Anything.
 * @return True for a real day.
 */
export function isYmd( value: unknown ): value is string {
	return typeof value === 'string' && dayMs( value ) !== null;
}

/**
 * A `Y-m-d` day moved by whole days, with no timezone involved.
 *
 * @param ymd  - The day.
 * @param days - Days to add; negative goes back.
 * @return The new `Y-m-d`, or '' when `ymd` isn't a real day.
 */
export function addDays( ymd: string, days: number ): string {
	const ms = dayMs( ymd );
	return ms === null ? '' : new Date( ms + days * DAY_MS ).toISOString().slice( 0, 10 );
}

/**
 * Whole days from one `Y-m-d` to another (0 for the same day, negative when `to` is earlier).
 *
 * @param from - First day.
 * @param to   - Second day.
 * @return Days, or NaN when either isn't a real day.
 */
export function daysBetween( from: string, to: string ): number {
	const a = dayMs( from );
	const b = dayMs( to );
	return a === null || b === null ? NaN : Math.round( ( b - a ) / DAY_MS );
}

/**
 * A site-local day as a browser-local Date at its midnight, which is what `RangeCalendar` takes.
 *
 * @param ymd - Site-local `Y-m-d`.
 * @return The Date (invalid when `ymd` isn't a day).
 */
export function localDay( ymd: string ): Date {
	const parts = YMD.exec( ymd );
	return parts
		? new Date( Number( parts[ 1 ] ), Number( parts[ 2 ] ) - 1, Number( parts[ 3 ] ) )
		: new Date( NaN );
}

/**
 * A calendar Date back to `Y-m-d`, from its browser-local parts.
 *
 * @param value - A Date from `RangeCalendar`.
 * @return `Y-m-d`.
 */
export function ymdOf( value: Date ): string {
	const pad = ( part: number ) => String( part ).padStart( 2, '0' );
	return `${ value.getFullYear() }-${ pad( value.getMonth() + 1 ) }-${ pad( value.getDate() ) }`;
}

/**
 * The site's language as a BCP 47 tag for `RangeCalendar`, which reads `fr-FR` but not `fr_FR`.
 *
 * @param locale - A WordPress locale; defaults to the site's.
 * @return E.g. `fr-FR`, or `en-US` when it can't be read.
 */
export function calendarLocale( locale: string = getSettings().l10n?.locale || 'en_US' ): string {
	const [ language, region ] = locale.split( /[_-]/ );
	// Variants like `de_DE_formal` or `pt_PT_ao90` have no BCP 47 form, so only language and region stay.
	const tag =
		region && /^(?:[a-z]{2}|\d{3})$/i.test( region )
			? `${ language }-${ region.toUpperCase() }`
			: language;
	try {
		return Intl.getCanonicalLocales( tag )[ 0 ] ?? 'en-US';
	} catch {
		return 'en-US';
	}
}

/**
 * A log row's UTC `Y-m-d H:i:s` (or an ISO string) as a Date.
 *
 * @param value - The time.
 * @return The Date.
 */
export function parseUtc( value: string ): Date {
	return /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test( value )
		? new Date( `${ value.replace( ' ', 'T' ) }Z` )
		: new Date( value );
}

/**
 * The site's time format without seconds, e.g. `g:i a` or `H:i`.
 *
 * @return A PHP date format.
 */
function timeFormat(): string {
	return ( getSettings().formats?.time || 'g:i a' ).replace( /[:.]s/g, '' );
}

/**
 * "just now", "12 min ago" or "3 hours ago" for the last day; null for anything older.
 *
 * @param when - The moment.
 * @param now  - The current time in ms.
 * @return The label, or null.
 */
export function relativeTime( when: Date, now: number ): string | null {
	const minutes = Math.floor( Math.max( 0, now - when.getTime() ) / 60000 );
	if ( minutes < 1 ) {
		return __( 'just now', 'jetpack-send-pkg' );
	}
	if ( minutes < 60 ) {
		/* translators: %d: minutes ago. */
		return sprintf( _n( '%d min ago', '%d min ago', minutes, 'jetpack-send-pkg' ), minutes );
	}
	const hours = Math.floor( minutes / 60 );
	if ( hours < 24 ) {
		/* translators: %d: hours ago. */
		return sprintf( _n( '%d hour ago', '%d hours ago', hours, 'jetpack-send-pkg' ), hours );
	}
	return null;
}

/**
 * When an email went, the same way everywhere: relative for the last day, then the day and time
 * in the site's timezone and time format ("Oct 17, 4:18 pm"), with the year only when it isn't this one.
 *
 * @param when - The moment.
 * @param now  - The current time in ms.
 * @return The label.
 */
export function emailTime( when: Date, now: number ): string {
	if ( isNaN( when.getTime() ) ) {
		return '';
	}
	const relative = relativeTime( when, now );
	if ( relative ) {
		return relative;
	}
	const sameYear = dateI18n( 'Y', when ) === dateI18n( 'Y', new Date( now ) );
	return dateI18n( `${ sameYear ? 'M j' : 'M j, Y' }, ${ timeFormat() }`, when );
}

/**
 * The full date and time in the site's own formats, without seconds, for tooltips.
 *
 * @param when - The moment.
 * @return The label.
 */
export function fullTime( when: Date ): string {
	if ( isNaN( when.getTime() ) ) {
		return '';
	}
	const date = getSettings().formats?.date || 'F j, Y';
	return dateI18n( `${ date } ${ timeFormat() }`, when );
}

/**
 * A moment as a date in the site's own date format, e.g. "October 18, 2026".
 *
 * @param value - An ISO date and time.
 * @return The label, or the raw value when it can't be read.
 */
export function siteDate( value: string ): string {
	const when = new Date( value );
	return isNaN( when.getTime() )
		? value
		: dateI18n( getSettings().formats?.date || 'F j, Y', when );
}

/**
 * A calendar day the server already worked out in the site's timezone, e.g. `2026-11-01` as "Nov 1".
 *
 * @param day    - Site-local `Y-m-d`.
 * @param format - PHP date format.
 * @return The label, or '' when the day can't be read.
 */
export function dayLabel( day: string, format = 'M j' ): string {
	const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec( day );
	if ( ! parts ) {
		return '';
	}
	// Noon UTC, formatted in UTC, so no timezone can move it to another day.
	return gmdateI18n(
		format,
		new Date( Date.UTC( Number( parts[ 1 ] ), Number( parts[ 2 ] ) - 1, Number( parts[ 3 ] ), 12 ) )
	);
}

/**
 * A count in the site's language ("1,234" or "1.234"), not the browser's.
 *
 * @param value - The count.
 * @return The formatted count.
 */
export function formatCount( value: number ): string {
	const locale = ( getSettings().l10n?.locale || 'en_US' ).replace( '_', '-' );
	try {
		return new Intl.NumberFormat( locale ).format( value );
	} catch {
		return String( value );
	}
}
