/**
 * Check if a value is a valid 6-digit hex color
 * @param hex - The value to check
 * @return true if valid hex color format (e.g., '#ff0000')
 */
export const isValidHexColor = ( hex: unknown ): hex is string => {
	return typeof hex === 'string' && /^#[0-9a-fA-F]{6}$/.test( hex );
};

/**
 * Validate hex color format, throwing descriptive errors if invalid
 * @param  hex - The hex color string to validate
 * @throws {Error} if hex string is malformed
 */
export const validateHexColor = ( hex: unknown ): void => {
	if ( isValidHexColor( hex ) ) {
		return;
	}

	// Provide specific error messages for common issues
	if ( typeof hex !== 'string' ) {
		throw new Error( 'Hex color must be a string' );
	}
	if ( ! hex.startsWith( '#' ) ) {
		throw new Error( 'Hex color must start with #' );
	}
	if ( hex.length !== 7 ) {
		throw new Error( 'Hex color must be 7 characters long (e.g., #ff0000)' );
	}
	throw new Error( 'Hex color contains invalid characters. Only 0-9, a-f, A-F are allowed' );
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
 * Convert HSL color to hex
 *
 * @param hsl - HSL values as [h, s, l] where h is 0-360, s and l are 0-100
 * @return hex color string (e.g., '#ff0000')
 */
export const hslToHex = ( hsl: [ number, number, number ] ): string => {
	const [ h, s, l ] = hsl;

	// Normalize values
	const hNorm = h / 360;
	const sNorm = s / 100;
	const lNorm = l / 100;

	// No saturation = grayscale
	if ( sNorm === 0 ) {
		const gray = Math.round( lNorm * 255 );
		const hex = gray.toString( 16 ).padStart( 2, '0' );
		return `#${ hex }${ hex }${ hex }`;
	}

	const hueToRgb = ( p: number, q: number, t: number ): number => {
		let tNorm = t;
		if ( tNorm < 0 ) tNorm += 1;
		if ( tNorm > 1 ) tNorm -= 1;
		if ( tNorm < 1 / 6 ) return p + ( q - p ) * 6 * tNorm;
		if ( tNorm < 1 / 2 ) return q;
		if ( tNorm < 2 / 3 ) return p + ( q - p ) * ( 2 / 3 - tNorm ) * 6;
		return p;
	};

	const q = lNorm < 0.5 ? lNorm * ( 1 + sNorm ) : lNorm + sNorm - lNorm * sNorm;
	const p = 2 * lNorm - q;

	const r = Math.round( hueToRgb( p, q, hNorm + 1 / 3 ) * 255 );
	const g = Math.round( hueToRgb( p, q, hNorm ) * 255 );
	const b = Math.round( hueToRgb( p, q, hNorm - 1 / 3 ) * 255 );

	const rHex = r.toString( 16 ).padStart( 2, '0' );
	const gHex = g.toString( 16 ).padStart( 2, '0' );
	const bHex = b.toString( 16 ).padStart( 2, '0' );

	return `#${ rHex }${ gHex }${ bHex }`;
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

/**
 * Parse an HSL string like 'hsl(120, 50%, 50%)' into an HSL tuple.
 * Uses string manipulation instead of complex regex to avoid ReDoS vulnerabilities.
 *
 * @param hslString - HSL color string
 * @return HSL tuple [h, s, l] or null if invalid
 */
export const parseHslString = ( hslString: string ): [ number, number, number ] | null => {
	const lower = hslString.toLowerCase().trim();

	// Check prefix and suffix
	if ( ! lower.startsWith( 'hsl(' ) || ! lower.endsWith( ')' ) ) {
		return null;
	}

	// Extract the inner content: "120, 50%, 50%"
	const inner = lower.slice( 4, -1 ).trim();

	// Split by comma or whitespace (normalize separators)
	// Replace commas with spaces, then split on whitespace
	const parts = inner.replace( /,/g, ' ' ).split( /\s+/ ).filter( Boolean );

	if ( parts.length !== 3 ) {
		return null;
	}

	// Parse values, stripping % signs
	const h = parseFloat( parts[ 0 ] );
	const s = parseFloat( parts[ 1 ].replace( '%', '' ) );
	const l = parseFloat( parts[ 2 ].replace( '%', '' ) );

	if ( isNaN( h ) || isNaN( s ) || isNaN( l ) ) {
		return null;
	}

	// Normalize hue to 0-360 range
	const normalizedH = ( ( h % 360 ) + 360 ) % 360;

	return [ normalizedH, s, l ];
};

/**
 * Parse an RGB string like 'rgb(255, 0, 0)' into a hex color.
 * Uses string manipulation instead of complex regex to avoid ReDoS vulnerabilities.
 *
 * @param rgbString - RGB color string
 * @return hex color string or null if invalid
 */
export const parseRgbString = ( rgbString: string ): string | null => {
	const lower = rgbString.toLowerCase().trim();

	// Check prefix and suffix
	if ( ! lower.startsWith( 'rgb(' ) || ! lower.endsWith( ')' ) ) {
		return null;
	}

	// Extract the inner content: "255, 0, 0"
	const inner = lower.slice( 4, -1 ).trim();

	// Split by comma or whitespace (normalize separators)
	// Replace commas with spaces, then split on whitespace
	const parts = inner.replace( /,/g, ' ' ).split( /\s+/ ).filter( Boolean );

	if ( parts.length !== 3 ) {
		return null;
	}

	const r = Math.round( parseFloat( parts[ 0 ] ) );
	const g = Math.round( parseFloat( parts[ 1 ] ) );
	const b = Math.round( parseFloat( parts[ 2 ] ) );

	if ( isNaN( r ) || isNaN( g ) || isNaN( b ) ) {
		return null;
	}

	// Clamp values to valid range
	const clamp = ( value: number ) => Math.max( 0, Math.min( 255, value ) );
	const rHex = clamp( r ).toString( 16 ).padStart( 2, '0' );
	const gHex = clamp( g ).toString( 16 ).padStart( 2, '0' );
	const bHex = clamp( b ).toString( 16 ).padStart( 2, '0' );

	return `#${ rHex }${ gHex }${ bHex }`;
};

/**
 * Normalize any CSS color value to a hex color string.
 * Handles hex colors, HSL strings, RGB strings, and CSS variables.
 *
 * @param color      - Any CSS color value
 * @param element    - Optional DOM element for resolving CSS variables
 * @param resolveCss - Function to resolve CSS variables (injected for testability)
 * @return hex color string, or the original value if conversion fails
 */
export const normalizeColorToHex = (
	color: string,
	element?: HTMLElement | null,
	resolveCss?: ( value: string, el?: HTMLElement | null ) => string | null
): string => {
	if ( ! color || typeof color !== 'string' ) {
		return '';
	}

	// Already a valid hex color (6-digit format)
	if ( /^#[0-9a-fA-F]{6}$/.test( color ) ) {
		return color;
	}

	const trimmed = color.trim().toLowerCase();

	// Handle 3-digit hex colors
	if ( /^#[0-9a-f]{3}$/i.test( trimmed ) ) {
		const r = trimmed[ 1 ];
		const g = trimmed[ 2 ];
		const b = trimmed[ 3 ];
		return `#${ r }${ r }${ g }${ g }${ b }${ b }`;
	}

	// Handle CSS variables
	if ( trimmed.startsWith( '--' ) || trimmed.startsWith( 'var(' ) ) {
		if ( resolveCss ) {
			const resolved = resolveCss( color, element );
			if ( resolved ) {
				// Recursively normalize the resolved value
				return normalizeColorToHex( resolved, element, resolveCss );
			}
		}
		// Can't resolve CSS variable, return original
		return color;
	}

	// Handle HSL strings
	if ( trimmed.startsWith( 'hsl(' ) ) {
		const hsl = parseHslString( trimmed );
		if ( hsl ) {
			return hslToHex( hsl );
		}
		return color;
	}

	// Handle RGB strings
	if ( trimmed.startsWith( 'rgb(' ) ) {
		const hex = parseRgbString( trimmed );
		if ( hex ) {
			return hex;
		}
		return color;
	}

	// Unknown format, return as-is
	return color;
};

/**
 * Lighten a hex color by blending it with white.
 * Useful for creating color gradients or lighter variants.
 *
 * @param  hex   - Hex color string (e.g., '#98C8DF')
 * @param  blend - Blend amount with white (0 = original color, 1 = white)
 * @return Lightened hex color string (e.g., '#cce4ef')
 * @throws {Error} if hex string is malformed
 */
export const lightenHexColor = ( hex: string, blend: number ): string => {
	validateHexColor( hex );

	const r = parseInt( hex.slice( 1, 3 ), 16 );
	const g = parseInt( hex.slice( 3, 5 ), 16 );
	const b = parseInt( hex.slice( 5, 7 ), 16 );

	// Blend with white (255, 255, 255)
	const newR = Math.round( r + ( 255 - r ) * blend );
	const newG = Math.round( g + ( 255 - g ) * blend );
	const newB = Math.round( b + ( 255 - b ) * blend );

	return `#${ newR.toString( 16 ).padStart( 2, '0' ) }${ newG
		.toString( 16 )
		.padStart( 2, '0' ) }${ newB.toString( 16 ).padStart( 2, '0' ) }`;
};
