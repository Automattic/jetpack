/** Parses a numeric string from the API, falling back to 0 when it is not a number. */
export function sanitizeStringNumber( value: string ): number {
	const parsed = parseFloat( value );
	return isNaN( parsed ) ? 0 : parsed;
}
