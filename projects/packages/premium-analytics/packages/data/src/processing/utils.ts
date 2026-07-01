/**
 * Converts a string number to an actual number, with fallback to 0
 * for invalid values.
 *
 * @param value - String number from API
 * @return Parsed number or 0 if invalid
 */
export function sanitizeStringNumber( value: string ): number {
	const parsed = parseFloat( value );
	return isNaN( parsed ) ? 0 : parsed;
}
