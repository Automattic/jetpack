import { color as d3Color, hsl as d3Hsl } from '@visx/vendor/d3-color';

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
 * Convert hex color to rgba with specified opacity.
 * This is genuinely reusable across chart components.
 * @param  hex   - The hex color string (e.g., '#ff0000')
 * @param  alpha - The opacity value. Values outside the [0, 1] range will be clamped by the underlying d3 color library.
 * @return The rgba color string (e.g., 'rgba(255, 0, 0, 0.5)')
 * @throws {Error} if hex string is malformed or alpha is not a valid number
 */
export const hexToRgba = ( hex: string, alpha: number ): string => {
	validateHexColor( hex );

	if ( typeof alpha !== 'number' || isNaN( alpha ) ) {
		throw new Error( 'Alpha must be a number' );
	}

	// Safe to use non-null assertion since validateHexColor ensures valid hex
	return d3Color( hex )!.copy( { opacity: alpha } ).formatRgb();
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
 *
 * @param hslString - HSL color string
 * @return HSL tuple [h, s, l] or null if invalid
 */
export const parseHslString = ( hslString: string ): [ number, number, number ] | null => {
	const lower = hslString.toLowerCase().trim();

	// Check prefix - d3-color handles the parsing
	if ( ! lower.startsWith( 'hsl(' ) ) {
		return null;
	}

	const parsed = d3Hsl( lower );

	// d3Hsl returns NaN values for invalid colors
	if ( isNaN( parsed.h ) && isNaN( parsed.s ) && isNaN( parsed.l ) ) {
		return null;
	}

	// Normalize hue to 0-360 range (d3 may return NaN for achromatic colors)
	const h = isNaN( parsed.h ) ? 0 : ( ( parsed.h % 360 ) + 360 ) % 360;

	// d3-color uses 0-1 scale, convert to 0-100
	return [ h, parsed.s * 100, parsed.l * 100 ];
};

/**
 * Parse an RGB string like 'rgb(255, 0, 0)' into a hex color.
 *
 * @deprecated    Use normalizeColorToHex() instead, which handles all color formats including rgb() and rgba().
 * @param      rgbString - RGB color string (not RGBA)
 * @return        hex color string or null if invalid
 */
export const parseRgbString = ( rgbString: string ): string | null => {
	const lower = rgbString.toLowerCase().trim();

	// Check prefix - only handle rgb(), not rgba()
	// This is intentional - use normalizeColorToHex for rgba() support
	if ( ! lower.startsWith( 'rgb(' ) || lower.startsWith( 'rgba(' ) ) {
		return null;
	}

	const parsed = d3Color( lower );

	// d3Color returns null for invalid colors
	if ( ! parsed ) {
		return null;
	}

	// d3-color clamps values automatically
	return parsed.formatHex();
};

/**
 * Normalize any CSS color value to a hex color string.
 * Handles hex, HSL, HSLA, RGB, RGBA, named CSS colors, and CSS variables.
 *
 * @param color      - Any CSS color value
 * @param element    - Optional DOM element for resolving CSS variables
 * @param resolveCss - Function to resolve CSS variables (injected for testability)
 * @param _depth     - Internal recursion depth counter to prevent infinite loops
 * @return hex color string, or the original value if conversion fails
 */
export const normalizeColorToHex = (
	color: string,
	element?: HTMLElement | null,
	resolveCss?: ( value: string, el?: HTMLElement | null ) => string | null,
	_depth = 0
): string => {
	if ( ! color || typeof color !== 'string' ) {
		return '';
	}

	// Already a valid hex color (6-digit format)
	if ( /^#[0-9a-fA-F]{6}$/.test( color ) ) {
		return color;
	}

	const trimmed = color.trim().toLowerCase();

	// Handle 3-digit hex colors - expand to 6-digit
	if ( /^#[0-9a-f]{3}$/i.test( trimmed ) ) {
		const r = trimmed[ 1 ];
		const g = trimmed[ 2 ];
		const b = trimmed[ 3 ];
		return `#${ r }${ r }${ g }${ g }${ b }${ b }`;
	}

	// Handle CSS variables - must be resolved before d3-color can parse
	if ( trimmed.startsWith( '--' ) || trimmed.startsWith( 'var(' ) ) {
		if ( resolveCss ) {
			const resolved = resolveCss( color, element );
			if ( resolved && resolved !== color && _depth < 10 ) {
				// Recursively normalize the resolved value
				return normalizeColorToHex( resolved, element, resolveCss, _depth + 1 );
			}
		}
		// Can't resolve CSS variable, return original
		return color;
	}

	// Handle HSL, HSLA, RGB, and RGBA strings using d3-color
	if (
		trimmed.startsWith( 'hsl(' ) ||
		trimmed.startsWith( 'hsla(' ) ||
		trimmed.startsWith( 'rgb(' ) ||
		trimmed.startsWith( 'rgba(' )
	) {
		const parsed = d3Color( trimmed );
		if ( parsed ) {
			return parsed.formatHex();
		}
		return color;
	}

	// Attempt d3-color for any remaining format (e.g. named CSS colors like "steelblue")
	const parsed = d3Color( trimmed );
	if ( parsed ) {
		return parsed.formatHex();
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

/**
 * Blend one hex color toward another, per-channel in sRGB.
 *
 * @param  fromHex - Starting hex color, returned when blend is 0
 * @param  toHex   - Target hex color, returned when blend is 1
 * @param  blend   - Amount toward toHex, clamped to [0, 1]
 * @return Blended hex color string
 * @throws {Error} if either hex string is malformed
 */
export const mixHexColors = ( fromHex: string, toHex: string, blend: number ): string => {
	validateHexColor( fromHex );
	validateHexColor( toHex );

	const amount = Math.min( 1, Math.max( 0, blend ) );
	const channel = ( start: number, end: number ): string =>
		Math.round( start + ( end - start ) * amount )
			.toString( 16 )
			.padStart( 2, '0' );

	return `#${ channel(
		parseInt( fromHex.slice( 1, 3 ), 16 ),
		parseInt( toHex.slice( 1, 3 ), 16 )
	) }${ channel(
		parseInt( fromHex.slice( 3, 5 ), 16 ),
		parseInt( toHex.slice( 3, 5 ), 16 )
	) }${ channel( parseInt( fromHex.slice( 5, 7 ), 16 ), parseInt( toHex.slice( 5, 7 ), 16 ) ) }`;
};

/**
 * WCAG relative luminance of a hex color (0 = black, 1 = white).
 *
 * @param  hex - Hex color string (e.g., '#98C8DF')
 * @return Relative luminance in the range [0, 1]
 * @throws {Error} if hex string is malformed
 */
export const relativeLuminance = ( hex: string ): number => {
	validateHexColor( hex );

	const toLinear = ( value: number ): number => {
		const channel = value / 255;
		return channel <= 0.03928 ? channel / 12.92 : Math.pow( ( channel + 0.055 ) / 1.055, 2.4 );
	};

	const r = toLinear( parseInt( hex.slice( 1, 3 ), 16 ) );
	const g = toLinear( parseInt( hex.slice( 3, 5 ), 16 ) );
	const b = toLinear( parseInt( hex.slice( 5, 7 ), 16 ) );

	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/**
 * Whether light text reads better than dark text on the given background, using the W3C
 * luminance threshold (0.179) that maximizes contrast against black vs white.
 *
 * @param backgroundHex - Hex background color
 * @return true if light text should be used; false (dark text) for malformed colors
 */
export const prefersLightText = ( backgroundHex: string ): boolean => {
	if ( ! isValidHexColor( backgroundHex ) ) {
		return false;
	}
	return relativeLuminance( backgroundHex ) <= 0.179;
};
