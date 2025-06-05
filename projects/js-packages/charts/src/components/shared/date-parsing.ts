/**
 * Simplified date parsing utilities for local timezone handling
 *
 * This module provides utilities for parsing various date string formats and converting
 * them to local timezone dates. For formats without timezone info, they're treated as local.
 * For formats with timezone info, they're converted to the equivalent local time.
 *
 * Note: And specifically it prevents format `YYYY-MM-DD` being parsed as UTC date.
 * If we need more functionalities in the future, we should consider using the `date-fns` library.
 *
 * Key Features:
 * - All parsed dates are in local timezone
 * - Converts timezone-aware strings to local equivalent
 * - Robust input validation and error handling
 * - TypeScript type safety
 *
 * Supported Formats:
 * - YYYY-MM-DD (treated as local)
 * - YYYY-MM-DD HH:mm:ss (treated as local)
 * - YYYY-MM-DD HH:mm (treated as local)
 * - YYYY-MM-DDTHH:mm:ss (treated as local)
 * - YYYY-MM-DDTHH:mm (treated as local)
 * - YYYY-MM-DDTHH:mm:ssZ (converted to local)
 * - YYYY-MM-DDTHH:mm:ss±HH:mm (converted to local)
 *
 * @example
 * ```typescript
 * parseAsLocalDate("2025-01-01");                    // Local timezone
 * parseAsLocalDate("2025-01-01 14:30:00");           // Local timezone
 * parseAsLocalDate("2025-01-01 14:30");              // Local timezone
 * parseAsLocalDate("2025-01-01T14:30:00Z");          // UTC 14:30 → Local equivalent
 * parseAsLocalDate("2025-01-01T14:30:00+05:00");     // +05:00 14:30 → Local equivalent
 * ```
 */

interface DateComponents {
	year: number;
	month: number;
	day: number;
	hour: number;
	minute: number;
	second: number;
}

/**
 * Checks if a date string contains timezone information
 * @param {string} dateString - The date string to check for timezone information
 * @return {boolean} True if the date string contains timezone information (Z or ±HH:mm format), false otherwise
 */
const hasTimezone = ( dateString: string ): boolean => {
	return /T.*[Z]$|T.*[+-]\d{2}:?\d{2}$/.test( dateString );
};

/**
 * Parses date string components into an object (for naive date strings)
 * @param {string} dateString - The date string to parse into components
 * @return {DateComponents | null} Object containing parsed date components or null if parsing fails
 */
const parseToComponents = ( dateString: string ): DateComponents | null => {
	// Handle ISO format without timezone: "YYYY-MM-DDTHH:mm:ss", "YYYY-MM-DDTHH:mm:ss.SSS", or "YYYY-MM-DDTHH:mm"
	const isoMatch = dateString.match(
		/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d{3})?$/
	);
	if ( isoMatch ) {
		return {
			year: parseInt( isoMatch[ 1 ], 10 ),
			month: parseInt( isoMatch[ 2 ], 10 ),
			day: parseInt( isoMatch[ 3 ], 10 ),
			hour: parseInt( isoMatch[ 4 ], 10 ),
			minute: parseInt( isoMatch[ 5 ], 10 ),
			second: parseInt( isoMatch[ 6 ] || '0', 10 ),
		};
	}

	// Handle space-separated format: "YYYY-MM-DD HH:mm:ss" or "YYYY-MM-DD HH:mm"
	const spaceMatch = dateString.match( /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})(?::(\d{2}))?$/ );
	if ( spaceMatch ) {
		return {
			year: parseInt( spaceMatch[ 1 ], 10 ),
			month: parseInt( spaceMatch[ 2 ], 10 ),
			day: parseInt( spaceMatch[ 3 ], 10 ),
			hour: parseInt( spaceMatch[ 4 ], 10 ),
			minute: parseInt( spaceMatch[ 5 ], 10 ),
			second: parseInt( spaceMatch[ 6 ] || '0', 10 ),
		};
	}

	// Handle date-only format: "YYYY-MM-DD"
	const dateMatch = dateString.match( /^(\d{4})-(\d{2})-(\d{2})$/ );
	if ( dateMatch ) {
		return {
			year: parseInt( dateMatch[ 1 ], 10 ),
			month: parseInt( dateMatch[ 2 ], 10 ),
			day: parseInt( dateMatch[ 3 ], 10 ),
			hour: 0,
			minute: 0,
			second: 0,
		};
	}

	return null;
};

/**
 * Validates date component values
 * @param {DateComponents} components - The date components to validate
 * @return {boolean} True if all components have valid values, false otherwise
 */
const isValidComponents = ( components: DateComponents ): boolean => {
	return (
		components.month >= 1 &&
		components.month <= 12 &&
		components.day >= 1 &&
		components.day <= 31 &&
		components.hour >= 0 &&
		components.hour <= 23 &&
		components.minute >= 0 &&
		components.minute <= 59 &&
		components.second >= 0 &&
		components.second <= 59
	);
};

/**
 * Parses any supported date string format and returns a local timezone date
 *
 * - For strings without timezone info: treats as local timezone
 * - For strings with timezone info: converts to local timezone equivalent
 *
 * Supports:
 * - YYYY-MM-DD (local)
 * - YYYY-MM-DD HH:mm:ss (local)
 * - YYYY-MM-DD HH:mm (local)
 * - YYYY-MM-DDTHH:mm:ss (local)
 * - YYYY-MM-DDTHH:mm (local)
 * - YYYY-MM-DDTHH:mm:ssZ (UTC → local)
 * - YYYY-MM-DDTHH:mm:ss±HH:mm (offset → local)
 * @param {string} dateString - The date string to parse
 * @return {Date} A Date object representing the parsed date in local timezone
 */
export const parseAsLocalDate = ( dateString: string ): Date => {
	const trimmedString = dateString.trim();

	// If it has timezone information, parse as ISO and convert to local
	if ( hasTimezone( trimmedString ) ) {
		const isoDate = new Date( trimmedString );

		if ( isNaN( isoDate.getTime() ) ) {
			return new Date( NaN );
		}

		// Return the date as-is - JavaScript Date objects are already in local timezone
		// when you access their values, the timezone conversion is automatic
		return isoDate;
	}

	// For naive strings, parse as local timezone
	const components = parseToComponents( trimmedString );

	if ( ! components || ! isValidComponents( components ) ) {
		return new Date( NaN );
	}

	// Use Date constructor with individual components (always local timezone)
	// Note: month is 0-indexed in Date constructor
	return new Date(
		components.year,
		components.month - 1,
		components.day,
		components.hour,
		components.minute,
		components.second
	);
};

// Legacy function name for backward compatibility
export const parseLocalDate: ( dateString: string ) => Date = parseAsLocalDate;
