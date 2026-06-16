/**
 * Safe integer parsing with fallback value
 */
export function safeParseInt( value: unknown, fallback = 0 ): number {
	const num = parseInt( String( value ), 10 );
	return isNaN( num ) ? fallback : num;
}

/**
 * Safe float parsing with fallback value
 */
export function safeParseFloat( value: unknown, fallback = 0 ): number {
	const num = parseFloat( String( value ) );
	return isNaN( num ) ? fallback : num;
}
