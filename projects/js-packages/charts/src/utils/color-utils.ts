/**
 * Validate hex color format
 * @param  hex - The hex color string to validate
 * @throws {Error} if hex string is malformed
 */
const validateHexColor = ( hex: string ): void => {
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
};

/**
 * Convert hex color to rgba with specified opacity
 * This is genuinely reusable across chart components
 * @param  hex   - The hex color string (e.g., '#ff0000')
 * @param  alpha - The opacity value between 0 and 1
 * @return The rgba color string (e.g., 'rgba(255, 0, 0, 0.5)')
 * @throws {Error} if hex string is malformed
 */
export const hexToRgba = ( hex: string, alpha: number ): string => {
	validateHexColor( hex );

	// Validate alpha
	if ( typeof alpha !== 'number' || isNaN( alpha ) ) {
		throw new Error( 'Alpha must be a number' );
	}

	const r = parseInt( hex.slice( 1, 3 ), 16 );
	const g = parseInt( hex.slice( 3, 5 ), 16 );
	const b = parseInt( hex.slice( 5, 7 ), 16 );
	return `rgba(${ r }, ${ g }, ${ b }, ${ alpha })`;
};

/**
 * Convert hex color to HSL
 * @param  hex - hex color string
 * @return HSL values as [h, s, l]
 * @throws {Error} if hex string is malformed
 */
export const hexToHsl = ( hex: string ): [ number, number, number ] => {
	validateHexColor( hex );

	const r = parseInt( hex.slice( 1, 3 ), 16 ) / 255;
	const g = parseInt( hex.slice( 3, 5 ), 16 ) / 255;
	const b = parseInt( hex.slice( 5, 7 ), 16 ) / 255;

	const max = Math.max( r, g, b );
	const min = Math.min( r, g, b );
	let h = 0;
	let s = 0;
	const l = ( max + min ) / 2;

	if ( max !== min ) {
		const d = max - min;
		s = l > 0.5 ? d / ( 2 - max - min ) : d / ( max + min );

		switch ( max ) {
			case r:
				h = ( g - b ) / d + ( g < b ? 6 : 0 );
				break;
			case g:
				h = ( b - r ) / d + 2;
				break;
			case b:
				h = ( r - g ) / d + 4;
				break;
		}
		h /= 6;
	}

	return [ h * 360, s * 100, l * 100 ];
};

/**
 * Calculate the perceptual distance between two HSL colors
 * @param hsl1 - first color in HSL format [h, s, l]
 * @param hsl2 - second color in HSL format [h, s, l]
 * @return distance value (0-100+, lower means more similar)
 */
export const getColorDistance = (
	hsl1: [ number, number, number ],
	hsl2: [ number, number, number ]
): number => {
	const [ h1, s1, l1 ] = hsl1;
	const [ h2, s2, l2 ] = hsl2;

	// Calculate hue difference, accounting for circular nature (0° = 360°)
	let hueDiff = Math.abs( h1 - h2 );
	hueDiff = Math.min( hueDiff, 360 - hueDiff );

	// Weight the differences: hue is most important, then lightness, then saturation
	const hueWeight = 2;
	const lightnessWeight = 1;
	const saturationWeight = 0.5;

	return Math.sqrt(
		Math.pow( hueDiff * hueWeight, 2 ) +
			Math.pow( ( l1 - l2 ) * lightnessWeight, 2 ) +
			Math.pow( ( s1 - s2 ) * saturationWeight, 2 )
	);
};
