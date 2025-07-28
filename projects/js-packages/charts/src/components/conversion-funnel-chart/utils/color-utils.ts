/**
 * Convert hex color to rgba with specified opacity
 * This is genuinely reusable across chart components
 * @param hex   - The hex color string (e.g., '#ff0000')
 * @param alpha - The opacity value between 0 and 1
 * @return The rgba color string (e.g., 'rgba(255, 0, 0, 0.5)')
 * @throws Error if hex string is malformed
 */
export const hexToRgba = ( hex: string, alpha: number ): string => {
	// Validate hex format
	if ( typeof hex !== 'string' ) {
		throw new Error( 'Hex color must be a string' );
	}

	// Check if hex starts with #
	if ( ! hex.startsWith( '#' ) ) {
		throw new Error( 'Hex color must start with #' );
	}

	// Check length (should be 7 characters: # + 6 hex digits)
	if ( hex.length !== 7 ) {
		throw new Error( 'Hex color must be 7 characters long (e.g., #ff0000)' );
	}

	// Check if all characters after # are valid hex digits
	const hexDigits = hex.slice( 1 );
	if ( ! /^[0-9a-fA-F]{6}$/.test( hexDigits ) ) {
		throw new Error( 'Hex color contains invalid characters. Only 0-9, a-f, A-F are allowed' );
	}

	// Validate alpha
	if ( typeof alpha !== 'number' || isNaN( alpha ) ) {
		throw new Error( 'Alpha must be a number' );
	}

	const r = parseInt( hex.slice( 1, 3 ), 16 );
	const g = parseInt( hex.slice( 3, 5 ), 16 );
	const b = parseInt( hex.slice( 5, 7 ), 16 );
	return `rgba(${ r }, ${ g }, ${ b }, ${ alpha })`;
};
