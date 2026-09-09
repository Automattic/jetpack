/**
 * @file Date parsing utilities using date-fns for local timezone handling
 *
 * This module provides utilities for parsing various date string formats and converting
 * them to dates using the battle-tested date-fns library. A format carrying timezone info
 * is a true instant and parses the same everywhere. A format without it is a wall-clock
 * reading, so it means nothing until a zone is named: it is read in the supplied
 * `timeZone`, or in the runtime's own when none is supplied.
 *
 * Note: And specifically it prevents format `YYYY-MM-DD` being parsed as UTC date.
 *
 * Key Features:
 * - Naive strings are read in the supplied zone, or the runtime's own
 * - Converts timezone-aware strings to their instant
 * - Robust input validation and error handling using date-fns
 * - TypeScript type safety
 * - Much smaller codebase than custom parsing
 *
 * Supported Formats:
 * - YYYY-MM-DD (treated as local)
 * - YYYY-MM-DD HH:mm:ss (treated as local)
 * - YYYY-MM-DD HH:mm (treated as local)
 * - YYYY-MM-DDTHH:mm:ss (treated as local)
 * - YYYY-MM-DDTHH:mm:ss.SSS (treated as local)
 * - YYYY-MM-DDTHH:mm (treated as local)
 * - YYYY-MM-DDTHH:mm:ssZ (converted to local)
 * - YYYY-MM-DDTHH:mm:ss±HH:mm (converted to local)
 *
 * @example
 * ```typescript
 * parseAsLocalDate("2025-01-01");                     // Local timezone
 * parseAsLocalDate("2025-01-01 14:30:00");            // Local timezone
 * parseAsLocalDate("2025-01-01 14:30");               // Local timezone
 * parseAsLocalDate("2025-01-01T14:30:45.123");        // Local timezone
 * parseAsLocalDate("2025-01-01T14:30:00Z");           // UTC 14:30 → Local equivalent
 * parseAsLocalDate("2025-01-01T14:30:00+05:00");      // +05:00 14:30 → Local equivalent
 * parseAsLocalDate("2025-01-01", "Asia/Tokyo");       // Midnight in Tokyo
 * ```
 */

import { parse, parseISO, isValid } from 'date-fns';

/**
 * Checks if a date string contains timezone information
 * @param {string} dateString - The date string to check for timezone information
 * @return {boolean} True if the date string contains timezone information, false otherwise
 */
const hasTimezone = ( dateString: string ): boolean => {
	const tIndex = dateString.indexOf( 'T' );
	if ( tIndex === -1 ) {
		return false;
	}

	if ( dateString.endsWith( 'Z' ) ) {
		return true;
	}

	return /[+-]\d{2}:?\d{2}$/.test( dateString.slice( tIndex + 1 ) );
};

// Enough of the calendar to invert a zone's offset. `en-US` with `h23` pins the
// digits as Latin and the clock as 0-23; `Date.UTC` below counts in the Gregorian
// calendar these parts are read on.
const OFFSET_OPTIONS: Intl.DateTimeFormatOptions = {
	year: 'numeric',
	month: 'numeric',
	day: 'numeric',
	hour: 'numeric',
	minute: 'numeric',
	second: 'numeric',
	hourCycle: 'h23',
};

// One formatter per zone. Every point in a series is parsed through this, and
// building an `Intl.DateTimeFormat` is what costs. `null` marks a zone `Intl`
// rejected, so a bad zone is tried once rather than on every point.
const offsetFormatters = new Map< string, Intl.DateTimeFormat | null >();

const getOffsetFormatter = ( timeZone: string ): Intl.DateTimeFormat | null => {
	if ( ! offsetFormatters.has( timeZone ) ) {
		try {
			offsetFormatters.set(
				timeZone,
				new Intl.DateTimeFormat( 'en-US', { ...OFFSET_OPTIONS, timeZone } )
			);
		} catch {
			offsetFormatters.set( timeZone, null );
		}
	}

	return offsetFormatters.get( timeZone ) ?? null;
};

// `Date.UTC` reads a year below 100 as 1900 + year, which would silently re-date
// the first century. `setUTCFullYear` has no such mapping.
const asUtcMs = ( fields: {
	year: number;
	month: number;
	day: number;
	hour: number;
	minute: number;
	second: number;
	ms: number;
} ): number => {
	const date = new Date( 0 );
	date.setUTCFullYear( fields.year, fields.month - 1, fields.day );
	date.setUTCHours( fields.hour, fields.minute, fields.second, fields.ms );
	return date.getTime();
};

// How far ahead of UTC `timeZone` was at this instant, in milliseconds.
const zoneOffsetMs = ( instant: number, formatter: Intl.DateTimeFormat ): number => {
	const parts = formatter.formatToParts( instant );
	const read = ( type: Intl.DateTimeFormatPartTypes ) =>
		Number( parts.find( part => part.type === type )?.value );

	// Parts are truncated to the second, so compare against the same truncation.
	return (
		asUtcMs( {
			year: read( 'year' ),
			month: read( 'month' ),
			day: read( 'day' ),
			hour: read( 'hour' ),
			minute: read( 'minute' ),
			second: read( 'second' ),
			ms: 0,
		} ) -
		Math.floor( instant / 1000 ) * 1000
	);
};

/**
 * The instant a wall-clock reading names in a given zone.
 *
 * @param wallClock - A `Date` whose local getters carry the fields to read; the instant it points at is not used.
 * @param timeZone  - IANA zone the fields are read in.
 * @return The instant, or the wall clock unchanged where `Intl` rejects the zone.
 */
const wallClockToInstant = ( wallClock: Date, timeZone: string ): Date => {
	const formatter = getOffsetFormatter( timeZone );

	// A zone Intl cannot use degrades to the runtime's own rather than throwing:
	// this function is reached from a public helper whose contract is to return an
	// invalid date, never to throw, and `GlobalChartsProvider` has already warned
	// about an unusable zone before its own points get here.
	if ( ! formatter ) {
		return wallClock;
	}

	const fields = asUtcMs( {
		year: wallClock.getFullYear(),
		month: wallClock.getMonth() + 1,
		day: wallClock.getDate(),
		hour: wallClock.getHours(),
		minute: wallClock.getMinutes(),
		second: wallClock.getSeconds(),
		ms: wallClock.getMilliseconds(),
	} );

	// The offset depends on the instant, so the first answer is only a guess: a DST
	// transition between the two moves it. Re-reading the offset at the guess
	// settles every reading the zone actually has.
	const first = zoneOffsetMs( fields, formatter );
	const guess = fields - first;
	const second = zoneOffsetMs( guess, formatter );

	if ( first === second ) {
		return new Date( guess );
	}

	const corrected = fields - second;
	const third = zoneOffsetMs( corrected, formatter );

	if ( second === third ) {
		return new Date( corrected );
	}

	// A reading a spring-forward gap deleted, so no instant carries it. The smaller
	// offset moves it forward past the gap: a day bucket in a zone that springs
	// forward at midnight keeps its own calendar day instead of landing on the
	// previous one.
	return new Date( fields - Math.min( second, third ) );
};

/**
 * Parses any supported date string format and returns a local timezone date
 *
 * Uses date-fns for robust parsing and validation. A string carrying timezone info
 * is already an instant and is returned as one, whatever `timeZone` says. A string
 * without it is a wall-clock reading, dated in `timeZone` when one is supplied and
 * in the runtime's own zone when none is.
 *
 * Supports:
 * - YYYY-MM-DD (local)
 * - YYYY-MM-DD HH:mm:ss (local)
 * - YYYY-MM-DD HH:mm (local)
 * - YYYY-MM-DDTHH:mm:ss (local)
 * - YYYY-MM-DDTHH:mm:ss.SSS (local)
 * - YYYY-MM-DDTHH:mm (local)
 * - YYYY-MM-DDTHH:mm:ssZ (UTC → local)
 * - YYYY-MM-DDTHH:mm:ss±HH:mm (offset → local)
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
		const result = parse( trimmedString, format, new Date() );
		if ( isValid( result ) ) {
			return timeZone ? wallClockToInstant( result, timeZone ) : result;
		}
	}

	// If no format matched, return invalid date
	return new Date( NaN );
};
