/**
 * @file Date parsing: a naive string is dated in a supplied IANA zone, or the runtime's own
 *
 * A string carrying an offset is already an instant and parses the same everywhere. A string
 * without one is only a wall-clock reading, so it means nothing until a zone is named. See
 * `parseAsLocalDate` for the supported formats.
 *
 * Note: this specifically avoids date-fns's default of parsing `YYYY-MM-DD` as a UTC date.
 */

import { tzOffset } from '@date-fns/tz';
import { parse, parseISO, isValid } from 'date-fns';
import { warnOnce } from './warn-once';

/**
 * Checks if a date string contains timezone information
 *
 * The minutes are optional because ISO 8601 allows a bare `±hh`, which `parseISO` reads.
 *
 * @param {string} dateString - The date string to check for timezone information
 * @return {boolean} True if the date string contains timezone information, false otherwise
 */
export const hasTimezone = ( dateString: string ): boolean => {
	const tIndex = dateString.indexOf( 'T' );
	if ( tIndex === -1 ) {
		return false;
	}

	if ( dateString.endsWith( 'Z' ) ) {
		return true;
	}

	return /[+-]\d{2}(?::?\d{2})?$/.test( dateString.slice( tIndex + 1 ) );
};

// The wall clock, read off the string rather than back out of the parsed `Date`: date-fns
// builds that with local setters, so a runtime zone whose own DST gap swallows the reading
// hands back fields an hour out. Covers every naive shape in `formats` below, at the one to
// N digits date-fns reads each field as; it takes a short fraction literally, so `.5` is 5ms.
const NAIVE =
	/^(\d{1,4})-(\d{1,2})-(\d{1,2})(?:[T ](\d{1,2}):(\d{1,2})(?::(\d{1,2})(?:\.(\d{1,3}))?)?)?$/;

// `Date.UTC` reads a year below 100 as 1900 + year, which would silently re-date the first
// century. `setUTCFullYear` has no such mapping.
const asUtcMs = ( [ , ...fields ]: RegExpExecArray ): number => {
	const [ year, month, day, hour, minute, second, ms ] = fields.map( field =>
		Number( field ?? 0 )
	);
	const date = new Date( 0 );
	date.setUTCFullYear( year, month - 1, day );
	date.setUTCHours( hour, minute, second, ms );
	return date.getTime();
};

/**
 * The instant a wall-clock reading names in a given zone.
 *
 * A reading a spring-forward gap deleted moves forward past the gap, and one a fall-back
 * repeated resolves to a single instant. Neither is configurable: see CHARTS-268.
 *
 * @param wallClock - The reading, as the milliseconds it would be if it were UTC.
 * @param timeZone  - IANA zone the reading is dated in.
 * @return The instant, or `null` where `timeZone` is not a zone Intl accepts.
 */
const wallClockToInstant = ( wallClock: number, timeZone: string ): Date | null => {
	// `tzOffset` answers NaN for a zone Intl cannot use. Falling back to the runtime's zone
	// keeps the contract that this never throws, but it silently reinstates the very defect
	// the argument exists to fix, so say so where a developer can see it.
	const first = tzOffset( timeZone, new Date( wallClock ) );

	if ( Number.isNaN( first ) ) {
		warnOnce(
			`parse:timeZone:${ timeZone }`,
			`timeZone ${ JSON.stringify(
				timeZone
			) } is not a zone Intl accepts, so dates are read in the browser's zone. Pass an IANA name or a UTC offset such as "+05:30".`
		);
		return null;
	}

	// The offset depends on the instant, so the first answer is only a guess: a DST
	// transition between the two moves it. Re-reading the offset at the guess settles
	// every reading the zone actually has.
	const guess = wallClock - first * 60000;
	const second = tzOffset( timeZone, new Date( guess ) );

	if ( first === second ) {
		return new Date( guess );
	}

	const corrected = wallClock - second * 60000;
	const third = tzOffset( timeZone, new Date( corrected ) );

	if ( second === third ) {
		return new Date( corrected );
	}

	// The smaller offset moves the reading forward past the gap, so a day bucket in a zone
	// that springs forward at midnight keeps its own calendar day.
	return new Date( wallClock - Math.min( second, third ) * 60000 );
};

/**
 * Parses any supported date string format into an instant, dated in `timeZone` or the runtime's own
 *
 * Uses date-fns for robust parsing and validation. A string carrying timezone info
 * is already an instant and is returned as one, whatever `timeZone` says. A string
 * without it is a wall-clock reading, dated in `timeZone` when one is supplied and
 * in the runtime's own zone when none is.
 *
 * A wall clock a DST gap deleted is moved forward past the gap; one a fall-back repeated
 * resolves to a single instant. Neither policy is selectable. A zone `Intl` rejects falls
 * back to the runtime's own, and warns once outside production.
 *
 * @param {string} dateString - The date string to parse into a date
 * @param {string} [timeZone] - IANA zone a naive string is read in; the runtime's own when absent, and ignored by a string that carries its own offset
 * @return {Date} A Date object representing the parsed instant, or an invalid Date if parsing fails
 */
export const parseAsLocalDate = ( dateString: string, timeZone?: string ): Date => {
	const trimmedString = dateString.trim();

	// If it has timezone information, parse as ISO and convert to local
	if ( hasTimezone( trimmedString ) ) {
		const isoDate = parseISO( trimmedString );

		if ( ! isValid( isoDate ) ) {
			return new Date( NaN );
		}

		// parseISO automatically converts to local timezone
		return isoDate;
	}

	// For naive strings, try different local formats
	const formats = [
		'yyyy-MM-dd', // 2025-01-01
		'yyyy-MM-dd HH:mm:ss', // 2025-01-01 14:30:45
		'yyyy-MM-dd HH:mm', // 2025-01-01 14:30
		"yyyy-MM-dd'T'HH:mm:ss", // 2025-01-01T14:30:45
		"yyyy-MM-dd'T'HH:mm:ss.SSS", // 2025-01-01T14:30:45.123
		"yyyy-MM-dd'T'HH:mm", // 2025-01-01T14:30
	];

	for ( const format of formats ) {
		// date-fns still decides whether the string is a date at all, calendar rules included;
		// only the fields it read are untrustworthy, and only when a zone was named.
		const result = parse( trimmedString, format, new Date() );
		if ( ! isValid( result ) ) {
			continue;
		}

		if ( ! timeZone ) {
			return result;
		}

		const fields = NAIVE.exec( trimmedString );

		return ( fields && wallClockToInstant( asUtcMs( fields ), timeZone ) ) ?? result;
	}

	// If no format matched, return invalid date
	return new Date( NaN );
};
