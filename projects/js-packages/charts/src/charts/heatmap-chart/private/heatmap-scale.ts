import { contrastRatio } from '../../../providers/chart-context/private/perceptual-color';
import { mixHexColors } from '../../../utils/color-utils';

/** WCAG 1.4.11: the lowest filled cell must stand out from the chart background. */
export const HEATMAP_LOW_CONTRAST = 3;

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
	// Black or white, whichever contrasts more with the background: the way the scale deepens.
	const extreme =
		contrastRatio( '#000000', background ) >= contrastRatio( '#ffffff', background )
			? '#000000'
			: '#ffffff';
	const primaryContrast = contrastRatio( primary, background );

	const low =
		primaryContrast >= HEATMAP_LOW_CONTRAST
			? firstReaching( background, primary, background, HEATMAP_LOW_CONTRAST )
			: firstReaching( primary, extreme, background, HEATMAP_LOW_CONTRAST );
	const high =
		primaryContrast >= HEATMAP_HIGH_CONTRAST
			? primary
			: firstReaching( primary, extreme, background, HEATMAP_HIGH_CONTRAST );

	// Black or white reaches 4.58:1 on any background, so only `high` can run out of room.
	return { low: low ?? extreme, high: high ?? extreme };
};
