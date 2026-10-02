import { MIN_BACKGROUND_CONTRAST } from '../../../providers/chart-context/private/palette-generator';
import { contrastRatio } from '../../../providers/chart-context/private/perceptual-color';
import { mixHexColors, relativeLuminance } from '../../../utils/color-utils';

/** How far the scale runs past the low end, so its steps stay apart. */
export const HEATMAP_HIGH_CONTRAST = 9;

const STEPS = 200;

export type HeatmapScale = {
	/** Fill of the lowest value on the scale. */
	low: string;
	/** Fill of the highest value on the scale. */
	high: string;
};

// The first hex from `from` toward `to` reaching `target` against `background`. Measured on the
// rounded hex the browser paints, so an endpoint cannot land a hair under its threshold.
const firstReaching = ( from: string, to: string, background: string, target: number ) => {
	for ( let step = 0; step <= STEPS; step++ ) {
		const color = mixHexColors( from, to, step / STEPS );
		if ( contrastRatio( color, background ) >= target ) {
			return color;
		}
	}
	return null;
};

/**
 * The two ends of the heatmap fill scale, derived from the primary color so every scale clears
 * the same contrast against its background, whatever the theme color or mode.
 *
 * @param primary    - The resolved primary color, as six-digit hex.
 * @param background - The resolved chart background, as six-digit hex.
 * @return The scale ends, as six-digit hex.
 */
export const getHeatmapScale = ( primary: string, background: string ): HeatmapScale => {
	const primaryContrast = contrastRatio( primary, background );
	const primaryStandsOut = primaryContrast >= MIN_BACKGROUND_CONTRAST;
	// The scale deepens to black or white on the primary's own side of the background, so it never
	// crosses it. A primary too close to the background takes whichever contrasts more.
	let extreme: string;
	if ( primaryStandsOut ) {
		extreme =
			relativeLuminance( primary ) > relativeLuminance( background ) ? '#ffffff' : '#000000';
	} else {
		extreme =
			contrastRatio( '#000000', background ) >= contrastRatio( '#ffffff', background )
				? '#000000'
				: '#ffffff';
	}

	const low = primaryStandsOut
		? firstReaching( background, primary, background, MIN_BACKGROUND_CONTRAST )
		: firstReaching( primary, extreme, background, MIN_BACKGROUND_CONTRAST );
	const high =
		primaryContrast >= HEATMAP_HIGH_CONTRAST
			? primary
			: firstReaching( primary, extreme, background, HEATMAP_HIGH_CONTRAST );

	// `low` always resolves: the primary itself, or black or white (4.58:1 on any background).
	return { low: low ?? extreme, high: high ?? extreme };
};
