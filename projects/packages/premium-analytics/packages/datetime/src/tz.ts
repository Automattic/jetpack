/**
 * External dependencies
 */
import { tz, TZDate, TZDateMini, tzOffset } from '@date-fns/tz';
import { format, isValid, startOfDay, endOfDay } from 'date-fns';
/**
 * Internal dependencies
 */
import { readSiteTimestamp, type TimestampParts } from './site-timestamp';

type GrowTuple< T extends unknown[], Max extends number > = T[ 'length' ] extends Max
	? T
	: T | GrowTuple< [ ...T, number ], Max >;
/**
 * Date parts in the same order as the native `Date` constructor, from
 * `[ year, month ]` up to milliseconds.
 *
 * Contiguous prefixes only — the tuple is trimmed at the first `undefined`.
 */
type DateParts = GrowTuple< [ number, number ], 7 >;

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const MINUTE_IN_MS = 60 * 1000;

/**
 * Resolve wall-clock parts to the instant they name in a timezone.
 *
 * `TZDateMini`'s own parts constructor seeds its offset guess from the machine
 * timezone, so DST-ambiguous wall times resolve differently per host. This
 * resolves them deterministically instead.
 *
 * @param parts    - Wall-clock parts, `[ year, month, ...rest ]` as `Date.UTC` reads them.
 * @param timeZone - The timezone the wall time belongs to.
 * @return The timestamp of the resolved instant, in milliseconds.
 */
function wallPartsToTimestamp( parts: number[], timeZone: string ): number {
	const [ year, month, ...rest ] = parts;
	const wallAsUTC = Date.UTC( year, month, ...rest );

	// The offsets in effect a day before and after bracket any DST transition
	// the wall time can sit on.
	const before = tzOffset( timeZone, new Date( wallAsUTC - DAY_IN_MS ) );
	const after = tzOffset( timeZone, new Date( wallAsUTC + DAY_IN_MS ) );

	const candidates: number[] = [];
	for ( const offset of before === after ? [ before ] : [ before, after ] ) {
		const timestamp = wallAsUTC - offset * MINUTE_IN_MS;
		// The anchor only holds where its offset is actually in effect.
		if ( tzOffset( timeZone, new Date( timestamp ) ) === offset ) {
			candidates.push( timestamp );
		}
	}

	if ( candidates.length > 0 ) {
		// Two survivors mean a fall-back transition names the wall time twice;
		// the earliest timestamp is its first occurrence.
		return Math.min( ...candidates );
	}

	// No survivor means a spring-forward gap skips the wall time; the pre-gap
	// offset normalizes it forward past the transition.
	return wallAsUTC - before * MINUTE_IN_MS;
}

/**
 * Build a TZDate from `DateParts` in the given timezone, UTC when omitted.
 *
 * @param parts    - Wall-clock parts, `[ year, month, ...rest ]` as `Date.UTC` reads them.
 * @param timeZone - The timezone the wall time belongs to.
 * @return The zoned date.
 */
export function createTZDateFromParts( parts: DateParts, timeZone?: string ): TZDate {
	const tzid = timeZone ?? '+00:00';
	const dateParts: ( number | undefined )[] = [ ...parts ];

	// Trim until first undefined, to match one of the DateParts types.
	const idx = dateParts.indexOf( undefined );
	const datePartsTrimmed = idx === -1 ? dateParts : dateParts.slice( 0, idx );

	return new TZDateMini( wallPartsToTimestamp( datePartsTrimmed as number[], tzid ), tzid );
}

/**
 * Anchor wall-clock parts to a timezone.
 *
 * @param parts    - The wall-clock parts.
 * @param timeZone - The timezone the wall time belongs to.
 * @return The zoned date, or an invalid date when the timezone has no such day.
 */
function wallTimeToTZDate( parts: TimestampParts, timeZone: string ): TZDate {
	const date = createTZDateFromParts( parts, timeZone );

	// A zone that skips a whole day (Pacific/Apia, 2011-12-30) moves the wall time
	// onto the next one; comparing date parts keeps a DST-normalized time valid.
	const survivedRoundTrip =
		date.getFullYear() === parts[ 0 ] &&
		date.getMonth() === parts[ 1 ] &&
		date.getDate() === parts[ 2 ];

	return survivedRoundTrip ? date : new TZDateMini( NaN, timeZone );
}

/**
 * Create a TZDate, reading offset-less strings as wall time in the timezone.
 *
 * @param value
 * @param timeZone
 */
export function toLocalTZ( value?: number | string | Date, timeZone?: string ): TZDate {
	const tzid = timeZone ?? '+00:00';

	if ( value === undefined ) {
		return TZDateMini.tz( tzid );
	}

	if ( typeof value === 'string' ) {
		const timestamp = readSiteTimestamp( value );

		// Otherwise an unrecognized shape reaches `Date`, which resolves an
		// offset-less string in the browser's zone — the shift this module avoids.
		if ( ! timestamp?.isValid ) {
			return new TZDateMini( NaN, tzid );
		}

		// An offset already identifies an instant, so only wall times are
		// anchored to the timezone.
		return timestamp.offset
			? new TZDateMini( timestamp.value as unknown as number, tzid )
			: wallTimeToTZDate( timestamp.parts, tzid );
	}

	return new TZDateMini( value as number, tzid );
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
	const tzDate = new TZDateMini( new Date( date ).getTime(), timeZone );
	// endOfDay from date-fns respects the timezone context in TZDate
	return endOfDay( tzDate );
}
