export function safeParseInt( value: unknown, fallback = 0 ): number {
	const num = parseInt( String( value ), 10 );
	return isNaN( num ) ? fallback : num;
}

export function safeParseFloat( value: unknown, fallback = 0 ): number {
	const num = parseFloat( String( value ) );
	return isNaN( num ) ? fallback : num;
}
