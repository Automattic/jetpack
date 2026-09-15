import { parseISO } from 'date-fns';
import { hasTimezone } from '../../../utils/date-parsing';
import type { DataPointDate } from '../../../types';

// Branded so a bare string or a real instant cannot pass as either. `civilDate` and
// `writtenDayKey` validate what they mint; `civilKey` trusts its `CivilDate` argument.
declare const dayKeyBrand: unique symbol;
declare const civilDateBrand: unique symbol;

/** A calendar day as `yyyy-MM-dd`; the key every cell is bucketed on. */
export type DayKey = string & { readonly [ dayKeyBrand ]: true };

/** A UTC-midnight `Date` standing for a civil day, never a real instant. */
export type CivilDate = Date & { readonly [ civilDateBrand ]: true };

const DAY_MS = 86400000;

// A machine key, pinned so a locale like `th-TH-u-ca-buddhist-nu-thai` cannot key
// cells on Buddhist years in Thai digits.
const KEY_OPTIONS: Intl.DateTimeFormatOptions = {
	calendar: 'gregory',
	numberingSystem: 'latn',
	year: 'numeric',
	month: '2-digit',
	day: '2-digit',
};

const DATE_PREFIX = /^(\d{4})-(\d{2})-(\d{2})/;

const pad = ( value: number, length: number ) => String( value ).padStart( length, '0' );

/**
 * The day a UTC proxy stands for.
 *
 * @param date - UTC proxy.
 * @return Its day key.
 */
export const civilKey = ( date: CivilDate ): DayKey =>
	`${ pad( date.getUTCFullYear(), 4 ) }-${ pad( date.getUTCMonth() + 1, 2 ) }-${ pad(
		date.getUTCDate(),
		2
	) }` as DayKey;

/**
 * A day key as a UTC-midnight proxy. UTC has no DST, so every step below is exactly
 * `DAY_MS`.
 *
 * @param key - Day key.
 * @return The proxy, or null when the key names no real day.
 */
export const civilDate = ( key: string ): CivilDate | null => {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec( key );
	if ( ! match ) {
		return null;
	}

	// Via the setter rather than `Date.UTC`, which reads a two-digit year as 19xx.
	const date = new Date( 0 ) as CivilDate;
	date.setUTCFullYear( Number( match[ 1 ] ), Number( match[ 2 ] ) - 1, Number( match[ 3 ] ) );
	date.setUTCHours( 0, 0, 0, 0 );

	// Round-trip rather than range-check each part, so Feb 30 is rejected too.
	return civilKey( date ) === key ? date : null;
};

/**
 * The day a written date names, ignoring any time and zone it carries.
 *
 * @param text - `yyyy-MM-dd`, optionally followed by a time.
 * @return Its day key, or null.
 */
export const writtenDayKey = ( text: string ): DayKey | null => {
	const match = DATE_PREFIX.exec( text );
	if ( ! match ) {
		return null;
	}

	const key = `${ match[ 1 ] }-${ match[ 2 ] }-${ match[ 3 ] }`;
	return civilDate( key ) ? ( key as DayKey ) : null;
};

/**
 * Reads the day an instant falls on in a zone.
 *
 * @param timeZone - IANA zone name; absent leaves the runtime's own.
 * @return Reader taking a `Date`, null for a day no key can hold.
 */
export const instantDayReader = ( timeZone?: string ) => {
	const formatter = new Intl.DateTimeFormat( 'en-US', { ...KEY_OPTIONS, timeZone } );

	return ( date: Date ): DayKey | null => {
		const parts = formatter.formatToParts( date );
		const read = ( type: Intl.DateTimeFormatPartTypes ) =>
			parts.find( part => part.type === type )?.value ?? '';

		const key = `${ pad( Number( read( 'year' ) ), 4 ) }-${ read( 'month' ) }-${ read( 'day' ) }`;
		// A `Date` reaches year 275760, past the four digits a key holds, and a wider
		// key would break the lexicographic ordering the buckets are sorted on.
		return civilDate( key ) ? ( key as DayKey ) : null;
	};
};

/**
 * The day a series point belongs to.
 *
 * A `Date`, or a string carrying `Z` or an offset, is an instant read in the host's
 * zone. Anything else is a wall clock the host wrote, so its date part is the day.
 *
 * @param point       - Series point.
 * @param readInstant - Reader from `instantDayReader`.
 * @return Its day key, or null when the point carries no usable date.
 */
export const pointDayKey = (
	point: DataPointDate,
	readInstant: ( date: Date ) => DayKey | null
): DayKey | null => {
	// An unusable `date` falls through to `dateString`: a host that fills both fields
	// has a working value in the second. A year too wide for a key is unusable too.
	if ( point.date instanceof Date && ! isNaN( point.date.getTime() ) ) {
		const key = readInstant( point.date );
		if ( key ) {
			return key;
		}
	}

	const text = point.dateString;
	if ( ! text ) {
		return null;
	}

	if ( ! hasTimezone( text ) ) {
		return writtenDayKey( text );
	}

	const parsed = parseISO( text );
	return isNaN( parsed.getTime() ) ? null : readInstant( parsed );
};

/**
 * Steps a proxy by whole days.
 *
 * @param date - UTC proxy.
 * @param days - Days to add; may be negative.
 * @return The shifted proxy.
 */
export const addCivilDays = ( date: CivilDate, days: number ): CivilDate =>
	new Date( date.getTime() + days * DAY_MS ) as CivilDate;

/**
 * Rounds a proxy down to its week.
 *
 * @param date         - UTC proxy.
 * @param weekStartsOn - 0 for Sunday, 1 for Monday.
 * @return The proxy for that week's first day.
 */
export const startOfCivilWeek = ( date: CivilDate, weekStartsOn: 0 | 1 ): CivilDate => {
	const daysSinceWeekStart = ( date.getUTCDay() - weekStartsOn + 7 ) % 7;
	return addCivilDays( date, -daysSinceWeekStart );
};

/**
 * Counts the columns a span needs.
 *
 * @param from         - Earlier UTC proxy.
 * @param to           - Later UTC proxy.
 * @param weekStartsOn - 0 for Sunday, 1 for Monday.
 * @return Columns needed to cover the span, inclusive.
 */
export const civilWeekSpan = ( from: CivilDate, to: CivilDate, weekStartsOn: 0 | 1 ): number =>
	Math.floor(
		( startOfCivilWeek( to, weekStartsOn ).getTime() -
			startOfCivilWeek( from, weekStartsOn ).getTime() ) /
			( 7 * DAY_MS )
	) + 1;
