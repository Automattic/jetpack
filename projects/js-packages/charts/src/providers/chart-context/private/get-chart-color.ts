import { getColorDistance } from '../../../utils';

export interface ColorCache {
	colors: string[];
	hues: number[];
	existingHslColors: Array< [ number, number, number ] >;
	minHue: number;
	maxHue: number;
}

/**
 * Get a color from the colors array or generate a new color using the golden ratio
 *
 * @param index      - the index of the color to get
 * @param colorCache - pre-computed color data for performance
 * @return a color from the colors array or a new color using the golden ratio
 */
export const getChartColor = ( index: number, colorCache: ColorCache ) => {
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
	const goldenRatio = 0.618033988749;
	const minColorDistance = 25; // Minimum perceptual distance to existing colors
	const maxAttempts = 50; // Prevent infinite loops

	for ( let attempt = 0; attempt < maxAttempts; attempt++ ) {
		let hue = ( ( index - colors.length + attempt * 0.1 ) * goldenRatio * 360 ) % 360;

		// If we have existing colors, constrain new colors to their hue range
		if ( hues.length > 0 ) {
			// Handle hue wrap-around (e.g., if colors span across 0 degrees)
			let hueRange = maxHue - minHue;

			// If the range is very large, it might be wrapping around 360
			// Check if a smaller range exists when considering wrap-around
			if ( hueRange > 180 ) {
				// Try the alternative: wrap around 360
				const altMinHue = Math.min( ...hues.filter( h => h > 180 ) );
				const altMaxHue = Math.max( ...hues.filter( h => h < 180 ) ) + 360;
				const altRange = altMaxHue - altMinHue;

				if ( altRange < hueRange ) {
					minHue = altMinHue;
					maxHue = altMaxHue;
					hueRange = altRange;
				}
			}

			// Expand the range slightly to provide some variation
			const expandedRange = Math.max( hueRange * 1.3, 60 ); // At least 60 degrees
			const rangeCenter = ( minHue + maxHue ) / 2;
			const expandedMin = rangeCenter - expandedRange / 2;

			// Map the generated hue to the expanded range
			hue = expandedMin + ( hue / 360 ) * expandedRange;

			// Normalize to 0-360 range
			hue = ( ( hue % 360 ) + 360 ) % 360;
		}

		const saturation = 60 + ( ( index + attempt ) % 3 ) * 15; // Vary saturation
		const lightness = 35 + ( ( index + attempt ) % 4 ) * 8; // Vary lightness (35-59% for WCAG AA compliance)

		const candidateHsl: [ number, number, number ] = [ hue, saturation, lightness ];

		// Check if this color is sufficiently different from existing colors
		let isSufficientlyDifferent = true;
		for ( const existingHsl of existingHslColors ) {
			if ( getColorDistance( candidateHsl, existingHsl ) < minColorDistance ) {
				isSufficientlyDifferent = false;
				break;
			}
		}

		if ( isSufficientlyDifferent ) {
			return `hsl(${ Math.round( hue ) }, ${ saturation }%, ${ lightness }%)`;
		}
	}

	// Fallback if we couldn't find a sufficiently different color
	const fallbackHue = ( ( index - colors.length ) * goldenRatio * 360 ) % 360;
	const fallbackSaturation = 60 + ( index % 3 ) * 15;
	const fallbackLightness = 35 + ( index % 4 ) * 8;
	return `hsl(${ Math.round( fallbackHue ) }, ${ fallbackSaturation }%, ${ fallbackLightness }%)`;
};
