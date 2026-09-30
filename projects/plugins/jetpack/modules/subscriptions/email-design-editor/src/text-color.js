/**
 * Contrast math and text color derivation for the newsletter email design.
 *
 * A derived text color is a tint of its background: the background's hue and saturation at a
 * lightness far enough away to read, dark on a light background and light on a dark one.
 *
 * A port of WordPress.com's `WPCOM_Email_Text_Color`, which derives the same way at render for
 * blogs that inherit their theme colors, so the two must agree.
 * `test/data/text-color-derivation.json` is a copy of the fixture pinning that agreement; a change
 * to the derivation changes both copies. See NL-959.
 *
 * Contrast follows WCAG 2.x: relative luminance of sRGB, ratio (L1 + 0.05) / (L2 + 0.05).
 */

// WCAG AA contrast for body-size text. Every derived color meets it.
export const MINIMUM_CONTRAST = 4.5;

// Lightness a derived dark text color starts from, on HSL's 0-100 scale.
//
// Starting well past the minimum is what makes the result read as body text rather than as a color
// that merely passes: at 15 a white background gets #262626, where searching only for 4.5:1 would
// stop at a mid gray.
const DARK_LIGHTNESS = 15;

// Lightness a derived light text color starts from, on HSL's 0-100 scale.
const LIGHT_LIGHTNESS = 95;

const HEX = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/;
const FUNCTIONAL = /^(rgb|hsl)a?\(\s*([^()]*?)\s*\)$/;
const NUMBER = /^(\d+(?:\.\d+)?|\.\d+)(%?)$/;

/**
 * Derive a text color for a background.
 *
 * Dark text goes on a background that contrasts more with black than with white, light text on the
 * rest. If the starting tint falls short of `MINIMUM_CONTRAST` — a saturated background can,
 * because saturation costs luminance — lightness moves one step at a time toward black or white
 * until it passes. The chosen side's extreme is always at least 4.58:1 (the square root of 21), so
 * the search ends.
 *
 * @param {*} background - The background color.
 * @return {string|null} Lowercase `#rrggbb`, or null when the background cannot be parsed.
 */
export function deriveTextColor( background ) {
	const rgb = parseColor( background );

	if ( null === rgb ) {
		return null;
	}

	const backgroundLuminance = relativeLuminance( rgb );
	const dark = ratio( 0, backgroundLuminance ) >= ratio( 1, backgroundLuminance );
	const [ hue, saturation ] = rgbToHsl( rgb );
	const step = dark ? -1 : 1;

	for (
		let lightness = dark ? DARK_LIGHTNESS : LIGHT_LIGHTNESS;
		lightness >= 0 && lightness <= 100;
		lightness += step
	) {
		const candidate = hslToRgb( hue, saturation, lightness / 100 );

		if ( ratio( relativeLuminance( candidate ), backgroundLuminance ) >= MINIMUM_CONTRAST ) {
			return toHex( candidate );
		}
	}

	return dark ? '#000000' : '#ffffff';
}

/**
 * The contrast ratio between two colors, from 1 (identical luminance) to 21 (black on white).
 *
 * @param {*} first  - A color.
 * @param {*} second - A color.
 * @return {number|null} The ratio, or null when either color cannot be parsed.
 */
export function contrastRatio( first, second ) {
	const firstRgb = parseColor( first );
	const secondRgb = parseColor( second );

	if ( null === firstRgb || null === secondRgb ) {
		return null;
	}

	return ratio( relativeLuminance( firstRgb ), relativeLuminance( secondRgb ) );
}

/**
 * Read a color into its sRGB channels.
 *
 * Accepts hex (`#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`), `rgb()`/`rgba()` and `hsl()`/`hsla()` in
 * comma or space syntax. A translucent color is refused rather than guessed at: what it looks like
 * depends on what is behind it, and contrast against an unknown is not a number. Named colors,
 * `var()`, gradients and `currentcolor` are refused too, so a caller can leave such a value exactly
 * as it found it.
 *
 * @param {*} color - The color.
 * @return {number[]|null} `[ r, g, b ]`, each 0-255, or null when the value is not an opaque color.
 */
export function parseColor( color ) {
	if ( 'string' !== typeof color ) {
		return null;
	}

	const value = color.trim().toLowerCase();
	const hexMatch = HEX.exec( value );

	if ( hexMatch ) {
		const hex =
			4 >= hexMatch[ 1 ].length
				? hexMatch[ 1 ].replace( /./g, digit => digit + digit )
				: hexMatch[ 1 ];

		if ( 8 === hex.length && 'ff' !== hex.slice( 6 ) ) {
			return null;
		}

		return [ 0, 2, 4 ].map( at => parseInt( hex.slice( at, at + 2 ), 16 ) );
	}

	const functionalMatch = FUNCTIONAL.exec( value );

	if ( ! functionalMatch ) {
		return null;
	}

	const [ , space, body ] = functionalMatch;

	// Two syntaxes, not interchangeable: `rgb(r, g, b[, a])`, or `rgb(r g b[ / a])`. A value mixing
	// them is invalid CSS that a mail client ignores, so it is refused rather than read.
	let parts;
	let alpha = null;

	if ( body.includes( ',' ) ) {
		if ( body.includes( '/' ) ) {
			return null;
		}

		parts = body.split( /\s*,\s*/ );

		if ( 4 === parts.length ) {
			alpha = parts.pop();
		}
	} else {
		const halves = body.split( /\s*\/\s*/ );

		if ( 2 < halves.length ) {
			return null;
		}

		parts = halves[ 0 ].split( /\s+/ );
		alpha = halves.length > 1 ? halves[ 1 ] : null;
	}

	if ( 3 !== parts.length ) {
		return null;
	}

	if ( null !== alpha ) {
		const opacity = number( alpha, 1 );

		if ( null === opacity || 1 > opacity ) {
			return null;
		}
	}

	if ( 'rgb' === space ) {
		const rgb = [];

		for ( const part of parts ) {
			const channel = number( part, 255 );

			if ( null === channel ) {
				return null;
			}

			rgb.push( Math.round( Math.min( 255, channel ) ) );
		}

		return rgb;
	}

	const hue = number( parts[ 0 ].replace( /deg$/, '' ), null );
	const saturation = number( parts[ 1 ], 1 );
	const lightness = number( parts[ 2 ], 1 );

	if (
		null === hue ||
		null === saturation ||
		null === lightness ||
		! parts[ 1 ].endsWith( '%' ) ||
		! parts[ 2 ].endsWith( '%' )
	) {
		return null;
	}

	return hslToRgb(
		( ( hue % 360 ) + 360 ) % 360,
		Math.min( 1, saturation ),
		Math.min( 1, lightness )
	);
}

/**
 * Read a non-negative number, scaling a percentage to `percentOf`.
 *
 * @param {string}      value     - The number, optionally with a trailing `%`.
 * @param {number|null} percentOf - What 100% means; null when a percentage is not allowed.
 * @return {number|null} The number, or null when the value is not one this accepts.
 */
function number( value, percentOf ) {
	const match = NUMBER.exec( value );

	if ( ! match ) {
		return null;
	}

	if ( '%' !== match[ 2 ] ) {
		return parseFloat( match[ 1 ] );
	}

	return null === percentOf ? null : ( parseFloat( match[ 1 ] ) / 100 ) * percentOf;
}

/**
 * WCAG relative luminance of an sRGB color.
 *
 * @param {number[]} rgb - `[ r, g, b ]`, each 0-255.
 * @return {number} 0 for black to 1 for white.
 */
function relativeLuminance( rgb ) {
	const [ red, green, blue ] = rgb.map( channel => {
		const value = channel / 255;

		return 0.04045 >= value ? value / 12.92 : ( ( value + 0.055 ) / 1.055 ) ** 2.4;
	} );

	return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

/**
 * Contrast ratio from two relative luminances, in either order.
 *
 * @param {number} first  - A relative luminance.
 * @param {number} second - A relative luminance.
 * @return {number} The ratio.
 */
function ratio( first, second ) {
	return ( Math.max( first, second ) + 0.05 ) / ( Math.min( first, second ) + 0.05 );
}

/**
 * Convert sRGB to hue (0-360) and saturation (0-1).
 *
 * Lightness is not returned because derivation sets its own.
 *
 * @param {number[]} rgb - `[ r, g, b ]`, each 0-255.
 * @return {number[]} `[ hue, saturation ]`.
 */
function rgbToHsl( rgb ) {
	const [ red, green, blue ] = rgb.map( channel => channel / 255 );
	const max = Math.max( red, green, blue );
	const min = Math.min( red, green, blue );
	const delta = max - min;

	if ( 0 === delta ) {
		return [ 0, 0 ];
	}

	const lightness = ( max + min ) / 2;
	const saturation = delta / ( 1 - Math.abs( 2 * lightness - 1 ) );
	let hue;

	if ( max === red ) {
		hue = 60 * ( ( ( green - blue ) / delta + 6 ) % 6 );
	} else if ( max === green ) {
		hue = 60 * ( ( blue - red ) / delta + 2 );
	} else {
		hue = 60 * ( ( red - green ) / delta + 4 );
	}

	return [ hue, Math.min( 1, saturation ) ];
}

/**
 * Convert hue (0-360), saturation (0-1) and lightness (0-1) to sRGB.
 *
 * @param {number} hue        - Hue in degrees.
 * @param {number} saturation - Saturation.
 * @param {number} lightness  - Lightness.
 * @return {number[]} `[ r, g, b ]`, each 0-255.
 */
function hslToRgb( hue, saturation, lightness ) {
	const chroma = ( 1 - Math.abs( 2 * lightness - 1 ) ) * saturation;
	const x = chroma * ( 1 - Math.abs( ( ( hue / 60 ) % 2 ) - 1 ) );
	const offset = lightness - chroma / 2;
	const sextants = [
		[ chroma, x, 0 ],
		[ x, chroma, 0 ],
		[ 0, chroma, x ],
		[ 0, x, chroma ],
		[ x, 0, chroma ],
		[ chroma, 0, x ],
	];

	return sextants[ Math.floor( hue / 60 ) % 6 ].map( channel =>
		Math.round( ( channel + offset ) * 255 )
	);
}

/**
 * Format sRGB channels as lowercase `#rrggbb`.
 *
 * @param {number[]} rgb - `[ r, g, b ]`, each 0-255.
 * @return {string} The color.
 */
function toHex( rgb ) {
	return `#${ rgb.map( channel => channel.toString( 16 ).padStart( 2, '0' ) ).join( '' ) }`;
}
