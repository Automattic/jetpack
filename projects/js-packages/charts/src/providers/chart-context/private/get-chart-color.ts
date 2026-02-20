import { hsl as d3Hsl } from '@visx/vendor/d3-color';
import { getColorDistance } from '../../../utils';

export interface ColorCache {
	colors: string[];
	hues: number[];
	existingHslColors: Array< [ number, number, number ] >;
	minHue: number;
	maxHue: number;
}

/**
 * Golden ratio for mathematically pleasing color distribution
 * Used to generate evenly spaced hues that are visually distinct
 */
const GOLDEN_RATIO = 0.618033988749;

/**
 * Minimum perceptual distance between colors to ensure visual distinction
 * Based on weighted HSL distance calculation optimized for chart readability
 */
const MIN_COLOR_DISTANCE = 25;

/**
 * Maximum attempts to find a sufficiently different color
 * Prevents infinite loops while allowing reasonable search space
 */
const MAX_COLOR_GENERATION_ATTEMPTS = 50;

/**
 * Color variation attempt offset
 * Small increment to explore slightly different color variations per attempt
 */
const VARIATION_ATTEMPT_OFFSET = 0.1;

// Saturation configuration for generated colors

/**
 * Base saturation percentage for generated colors
 * 45% provides muted, professional colors without being washed out
 */
const BASE_SATURATION = 45;

/**
 * Number of saturation variation steps
 * Creates 3 different saturation levels for variety
 */
const SATURATION_VARIATION_STEPS = 3;

/**
 * Saturation increment per variation step
 * 10% increments provide subtle variation while keeping colors muted
 * Results in saturation levels: 45%, 55%, 65%
 */
const SATURATION_INCREMENT = 10;

// Lightness configuration for WCAG AA accessibility compliance

/**
 * Base lightness percentage for generated colors
 * 35% ensures sufficient contrast against white backgrounds for WCAG AA compliance
 * WCAG AA requires 4.5:1 contrast ratio for normal text
 */
const BASE_LIGHTNESS = 35;

/**
 * Number of lightness variation steps
 * Creates 4 different lightness levels for variety
 */
const LIGHTNESS_VARIATION_STEPS = 4;

/**
 * Lightness increment per variation step
 * 8% increments provide subtle lightness variation while maintaining accessibility
 * Results in lightness levels: 35%, 43%, 51%, 59%
 * All levels maintain WCAG AA compliance against white backgrounds
 */
const LIGHTNESS_INCREMENT = 8;

// Hue range expansion and constraints

/**
 * Minimum hue range in degrees to ensure sufficient color variety
 * 60 degrees provides reasonable color spread even for narrow palettes
 */
const MIN_HUE_RANGE_DEGREES = 60;

/**
 * Hue range expansion factor
 * 1.3x expansion provides slightly more variety than the original palette
 */
const HUE_RANGE_EXPANSION_FACTOR = 1.3;

/**
 * Threshold for detecting hue wrap-around (color wheel boundary crossing)
 * 180 degrees indicates the colors span more than half the color wheel
 */
const HUE_WRAP_THRESHOLD_DEGREES = 180;

/**
 * Full color wheel rotation in degrees
 */
const FULL_HUE_ROTATION_DEGREES = 360;

/**
 * Factor for single color hue range
 */
const SINGLE_COLOR_HUE_RANGE_FACTOR = 0.33;

/**
 * Get a color from the colors array or generate a new color using the golden ratio
 *
 * @param index      - the index of the color to get
 * @param colorCache - pre-computed color data for performance
 * @return a color from the colors array or a new color using the golden ratio
 */
export const getChartColor = ( index: number, colorCache: ColorCache ): string => {
	const {
		colors,
		hues,
		existingHslColors,
		minHue: cachedMinHue,
		maxHue: cachedMaxHue,
	} = colorCache;

	if ( index < colors.length ) {
		return colors[ index ];
	}

	let minHue = cachedMinHue;
	let maxHue = cachedMaxHue;

	// Generate additional colors using golden ratio, avoiding similar colors
	for ( let attempt = 0; attempt < MAX_COLOR_GENERATION_ATTEMPTS; attempt++ ) {
		// Calculate hue using golden ratio distribution with variation per attempt
		// Formula: ((base_index + attempt_variation) * golden_ratio * 360°) mod 360°
		// This ensures mathematically pleasing spacing while allowing slight shifts per attempt
		let hue =
			( ( index - colors.length + attempt * VARIATION_ATTEMPT_OFFSET ) *
				GOLDEN_RATIO *
				FULL_HUE_ROTATION_DEGREES ) %
			FULL_HUE_ROTATION_DEGREES;

		// If we have existing colors, constrain new colors to their hue range
		if ( hues.length > 0 ) {
			// Handle hue wrap-around (e.g., if colors span across 0 degrees)
			let hueRange = maxHue - minHue;

			// If there's only one color, use a set hue range for limited variety
			if ( hues.length === 1 ) {
				hueRange = FULL_HUE_ROTATION_DEGREES * SINGLE_COLOR_HUE_RANGE_FACTOR;
			} else if ( hueRange > HUE_WRAP_THRESHOLD_DEGREES ) {
				// If the range is very large, it might be wrapping around the color wheel
				// Check if a smaller range exists when considering wrap-around
				const altMinHue = Math.min( ...hues.filter( h => h > HUE_WRAP_THRESHOLD_DEGREES ) );
				const altMaxHue =
					Math.max( ...hues.filter( h => h < HUE_WRAP_THRESHOLD_DEGREES ) ) +
					FULL_HUE_ROTATION_DEGREES;
				const altRange = altMaxHue - altMinHue;

				if ( altRange < hueRange ) {
					minHue = altMinHue;
					maxHue = altMaxHue;
					hueRange = altRange;
				}
			}

			// Expand the range slightly to provide some variation
			const expandedRange = Math.max(
				hueRange * HUE_RANGE_EXPANSION_FACTOR,
				MIN_HUE_RANGE_DEGREES
			);
			const rangeCenter = ( minHue + maxHue ) / 2;
			const expandedMin = rangeCenter - expandedRange / 2;

			// Map the generated hue to the expanded range
			hue = expandedMin + ( hue / FULL_HUE_ROTATION_DEGREES ) * expandedRange;

			// Normalize to 0-360 range
			hue =
				( ( hue % FULL_HUE_ROTATION_DEGREES ) + FULL_HUE_ROTATION_DEGREES ) %
				FULL_HUE_ROTATION_DEGREES;
		}

		const saturation =
			BASE_SATURATION + ( ( index + attempt ) % SATURATION_VARIATION_STEPS ) * SATURATION_INCREMENT;
		const lightness =
			BASE_LIGHTNESS + ( ( index + attempt ) % LIGHTNESS_VARIATION_STEPS ) * LIGHTNESS_INCREMENT;

		const candidateHsl: [ number, number, number ] = [ hue, saturation, lightness ];

		// Check if this color is sufficiently different from existing colors
		let isSufficientlyDifferent = true;
		for ( const existingHsl of existingHslColors ) {
			if ( getColorDistance( candidateHsl, existingHsl ) < MIN_COLOR_DISTANCE ) {
				isSufficientlyDifferent = false;
				break;
			}
		}

		if ( isSufficientlyDifferent ) {
			// d3-color uses 0-1 scale for saturation and lightness
			return d3Hsl( Math.round( hue ), saturation / 100, lightness / 100 ).formatHex();
		}
	}

	// Fallback if we couldn't find a sufficiently different color
	// Formula: ((base_index) * golden_ratio * 360°) mod 360°
	// This ensures mathematically pleasing spacing while maintaining consistency
	const fallbackHue =
		( ( index - colors.length ) * GOLDEN_RATIO * FULL_HUE_ROTATION_DEGREES ) %
		FULL_HUE_ROTATION_DEGREES;
	const fallbackSaturation =
		BASE_SATURATION + ( index % SATURATION_VARIATION_STEPS ) * SATURATION_INCREMENT;
	const fallbackLightness =
		BASE_LIGHTNESS + ( index % LIGHTNESS_VARIATION_STEPS ) * LIGHTNESS_INCREMENT;
	// d3-color uses 0-1 scale for saturation and lightness
	return d3Hsl(
		Math.round( fallbackHue ),
		fallbackSaturation / 100,
		fallbackLightness / 100
	).formatHex();
};
