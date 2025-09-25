/**
 * @file Date parsing utilities using date-fns for local timezone handling
 *
 * This module provides utilities for parsing various date string formats and converting
 * them to local timezone dates using the battle-tested date-fns library. For formats
 * without timezone info, they're treated as local. For formats with timezone info,
 * they're converted to the equivalent local time.
 *
 * Note: And specifically it prevents format `YYYY-MM-DD` being parsed as UTC date.
 *
 * Key Features:
 * - All parsed dates are in local timezone
 * - Converts timezone-aware strings to local equivalent
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
 * ```
 */

import { parse, parseISO, isValid } from 'date-fns';

/**
 * Checks if a date string contains timezone information
 * @param {string} dateString - The date string to check for timezone information
 * @return {boolean} True if the date string contains timezone information, false otherwise
 */
const hasTimezone = ( dateString: string ): boolean => {
	return /T.*[Z]$|T.*[+-]\d{2}:?\d{2}$/.test( dateString );
};

/**
 * Parses any supported date string format and returns a local timezone date
 *
 * Uses date-fns for robust parsing and validation. For strings without timezone
 * info, treats as local timezone. For strings with timezone info, converts to
 * local timezone equivalent.
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
 * @param {string} dateString - The date string to parse into a local timezone date
 * @return {Date} A Date object representing the parsed date in local timezone, or an invalid Date if parsing fails
 */
export const parseAsLocalDate = ( dateString: string ): Date => {
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
			return result;
		}
	}

	// If no format matched, return invalid date
	return new Date( NaN );
};
