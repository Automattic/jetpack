/**
 * Date-only, MySQL datetime, or ISO datetime values used by Stats and report
 * params.
 *
 * The fractional second is matched at any length, and truncated below. Capping
 * it here would drop a value like `.123456` through to `Date`, which reads an
 * offset-less string in the *browser's* zone — the shift this package avoids.
 */
const SITE_TIMESTAMP =
	/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?(Z|[+-]\d{2}:?\d{2})?)?$/;

/** The hours and minutes of a numeric offset. */
const OFFSET_PARTS = /^[+-](\d{2}):?(\d{2})$/;

/** Wall-clock parts in the same order as the native `Date` constructor. */
export type TimestampParts = [ number, number, number, number, number, number, number ];

export type SiteTimestamp = {
	/** The value with surrounding whitespace removed. */
	value: string;
	/** The wall-clock parts it names. */
	parts: TimestampParts;
	/** The stated offset, or undefined when the value names a wall time. */
	offset?: string;
	/** Whether it names a clock time, calendar day, and offset that exist. */
	isValid: boolean;
};

/**
 * Whether a year, month and day name a day that exists.
 *
 * @param year  - The full year.
 * @param month - The month index, 0–11.
 * @param day   - The day of the month.
 * @return Whether the date survives a round trip through `Date`.
 */
function isRealCalendarDate( year: number, month: number, day: number ): boolean {
	const probe = new Date( Date.UTC( year, month, day ) );

	return (
		probe.getUTCFullYear() === year && probe.getUTCMonth() === month && probe.getUTCDate() === day
	);
}

/**
 * Whether a stated offset names a real distance from UTC.
 *
 * @param offset - The offset as written, or undefined for a wall time.
 * @return Whether it is absent, `Z`, or within ±23:59.
 */
function isRealOffset( offset?: string ): boolean {
	if ( offset === undefined || offset === 'Z' ) {
		return true;
	}

	const match = OFFSET_PARTS.exec( offset );

	return !! match && Number( match[ 1 ] ) <= 23 && Number( match[ 2 ] ) <= 59;
}

/**
 * Read a timestamp string in one of the formats this package accepts.
 *
 * Every entry point that turns a string into a date goes through here, so they
 * agree on which values are timestamps at all and which of those are valid.
 *
 * @param value - The raw timestamp.
 * @return The timestamp, or null when the value has another format.
 */
export function readSiteTimestamp( value: string ): SiteTimestamp | null {
	const trimmed = value.trim();
	const match = SITE_TIMESTAMP.exec( trimmed );

	if ( ! match ) {
		return null;
	}

	const [ , year, month, day, hours, minutes, seconds, milliseconds, offset ] = match;
	const parts: TimestampParts = [
		Number( year ),
		Number( month ) - 1,
		Number( day ),
		Number( hours ?? 0 ),
		Number( minutes ?? 0 ),
		Number( seconds ?? 0 ),
		Number( ( milliseconds ?? '' ).slice( 0, 3 ).padEnd( 3, '0' ) ),
	];
	const isValid =
		parts[ 3 ] <= 23 &&
		parts[ 4 ] <= 59 &&
		parts[ 5 ] <= 59 &&
		isRealOffset( offset ) &&
		isRealCalendarDate( parts[ 0 ], parts[ 1 ], parts[ 2 ] );

	return { value: trimmed, parts, offset, isValid };
}
