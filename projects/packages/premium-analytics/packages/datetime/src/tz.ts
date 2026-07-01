/**
 * External dependencies
 */
import { tz, TZDate, TZDateMini } from '@date-fns/tz';
import { format, isValid, startOfDay, endOfDay } from 'date-fns';

type GrowTuple< T extends unknown[], Max extends number > = T[ 'length' ] extends Max
	? T
	: T | GrowTuple< [ ...T, number ], Max >;
/**
 * Date parts tuple in the same order as the native `Date` constructor:
 * [ year, month, day, hours, minutes, seconds, milliseconds ]
 *
 * Positions:
 * - year: full year, e.g. 2025
 * - month: month index 0–11 (0=January, 11=December)
 * - day: day of month 1–31 (default 1 if omitted)
 * - hours: 0–23 (default 0)
 * - minutes: 0–59 (default 0)
 * - seconds: 0–59 (default 0)
 * - milliseconds: 0–999 (default 0)
 *
 * Rules:
 * - Valid lengths: 2 to 7 elements (must always start with [year, month]).
 * - Do not skip intermediate positions: contiguous prefixes only (trimmed at the first `undefined`).
 * - Time zone is applied when creating the date (see `createTZDateFromParts`).
 *
 * Examples:
 * - [ 2025, 0 ] → 2025-01-01T00:00:00.000 (January is 0)
 * - [ 2025, 6, 15, 14, 30 ] → 2025-07-15T14:30:00.000
 */
type DateParts = GrowTuple< [ number, number ], 7 >;

/**
 *
 * @param root0
 * @param root0."0"
 * @param root0."1"
 * @param root0."2"
 * @param root0."3"
 * @param root0."4"
 * @param root0."5"
 * @param root0."6"
 * @param timeZone
 */
export function createTZDateFromParts(
	[ year, month, day, hours, minutes, seconds, milliseconds ]: DateParts,
	timeZone?: string
): TZDate {
	const tzid = timeZone ?? '+00:00';

	const dateParts = [ year, month, day, hours, minutes, seconds, milliseconds ];

	// Trim until first undefined, to match one of the DateParts types.
	const idx = dateParts.indexOf( undefined );
	const datePartsTrimmed = idx === -1 ? dateParts : dateParts.slice( 0, idx );

	// @ts-expect-error: We know datePartsTrimmed is a tuple of numbers, spreading is safe.
	return new TZDateMini( ...datePartsTrimmed, tzid );
}

/**
 * Create a TZDate in the provided timezone.
 * Defaults to UTC when no timezone is given.
 * @param value
 * @param timeZone
 */
export function toLocalTZ( value?: number | string | Date, timeZone?: string ): TZDate {
	const tzid = timeZone ?? '+00:00';
	if ( value !== undefined ) {
		return new TZDateMini( value as number, tzid );
	}

	return TZDateMini.tz( tzid );
}

/**
 * Format a date to a timezone-naive ISO string (no offset),
 * using the given timezone for interpretation.
 * Example: TZDateMini("...+01:00") -> "YYYY-MM-DDTHH:mm:ss.SSS"
 * @param date
 * @param timezone
 */
export function formatToTimezoneNaiveString( date: Date, timezone: string ): string {
	if ( ! isValid( date ) ) {
		throw new Error( 'Invalid date provided' );
	}
	return format( date, "yyyy-MM-dd'T'HH:mm:ss.SSS", { in: tz( timezone ) } );
}

/**
 * Convert a date to ISO string with the timezone offset applied.
 * Example output: "YYYY-MM-DDTHH:mm:ss.SSS±hh:mm"
 * @param date
 * @param timezone
 */
export function dateToISOStringWithTZ( date: Date, timezone: string ): string {
	return format( date, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx", {
		in: tz( timezone ),
	} );
}

/**
 * Returns the start of day (00:00:00) for the given date in the specified timezone.
 *
 * @param date     - The date to get the start of day for
 * @param timeZone - Timezone string (e.g., 'America/New_York', 'UTC', '+08:00')
 * @return A Date object representing midnight in the specified timezone
 */
export function startOfDayTZ( date: Date | number, timeZone: string ): Date {
	// Create TZDate in the target timezone - this interprets the input date in that timezone
	const tzDate = new TZDateMini( new Date( date ).getTime(), timeZone );
	// startOfDay from date-fns respects the timezone context in TZDate
	return startOfDay( tzDate );
}

/**
 * Returns the end of day (23:59:59.999) for the given date in the specified timezone.
 *
 * @param date     - The date to get the end of day for
 * @param timeZone - Timezone string (e.g., 'America/New_York', 'UTC', '+08:00')
 * @return A Date object representing the last millisecond of the day in the specified timezone
 */
export function endOfDayTZ( date: Date | number, timeZone: string ): Date {
	// Create TZDate in the target timezone - this interprets the input date in that timezone
	const tzDate = new TZDateMini( new Date( date ).getTime(), timeZone );
	// endOfDay from date-fns respects the timezone context in TZDate
	return endOfDay( tzDate );
}
