/**
 * Minimum-surface date/time helpers used by the podcast Stats date-range
 * picker. Mirrors `projects/packages/activity-log/src/js/components/DateRangePicker/datetime.ts`,
 * which itself is a trimmed port of Calypso's `client/dashboard/utils/datetime.ts`.
 */
import { dateI18n } from '@wordpress/date';
import { parse, isValid, format as fnsFormat } from 'date-fns';

const HOUR_MS = 3_600_000;
const YMD_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Localized date formatting via `Intl.DateTimeFormat`.
 *
 * @param date          - Date.
 * @param locale        - BCP 47 locale tag.
 * @param formatOptions - Format options.
 * @return              Formatted string.
 */
export function formatDate(
	date: Date,
	locale: string,
	formatOptions: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }
): string {
	if ( isNaN( date.getTime() ) ) {
		return '';
	}
	return new Intl.DateTimeFormat( locale, formatOptions ).format( date );
}

/**
 * Parse a `YYYY-MM-DD` string as a local-time Date. Returns null for
 * malformed input or overflow dates like `2023-02-31`.
 *
 * @param value - Input string.
 * @return      Parsed Date, or null.
 */
export function parseYmdLocal( value: string ): Date | null {
	if ( ! YMD_REGEX.test( value ) ) {
		return null;
	}
	const parsed = parse( value, 'yyyy-MM-dd', new Date() );
	if ( ! isValid( parsed ) ) {
		return null;
	}
	return fnsFormat( parsed, 'yyyy-MM-dd' ) === value ? parsed : null;
}

/**
 * Format a Date as the site's calendar day (`YYYY-MM-DD`).
 *
 * @param date           - Date.
 * @param timezoneString - IANA timezone identifier.
 * @param gmtOffset      - Offset in hours.
 * @return               `YYYY-MM-DD` string.
 */
export function formatYmd( date: Date, timezoneString?: string, gmtOffset?: number ): string {
	if ( timezoneString ) {
		return dateI18n( 'Y-m-d', date, timezoneString );
	}
	if ( typeof gmtOffset === 'number' ) {
		const shifted = new Date( date.getTime() + gmtOffset * HOUR_MS );
		const year = shifted.getUTCFullYear();
		const month = String( shifted.getUTCMonth() + 1 ).padStart( 2, '0' );
		const day = String( shifted.getUTCDate() ).padStart( 2, '0' );
		return `${ year }-${ month }-${ day }`;
	}
	return dateI18n( 'Y-m-d', date );
}

/**
 * Format a Date that already represents a site calendar day, without
 * re-applying timezone math.
 *
 * @param date - Date.
 * @return     `YYYY-MM-DD` string.
 */
export function formatSiteYmd( date: Date ): string {
	const year = date.getFullYear();
	const month = String( date.getMonth() + 1 ).padStart( 2, '0' );
	const day = String( date.getDate() ).padStart( 2, '0' );
	return `${ year }-${ month }-${ day }`;
}
