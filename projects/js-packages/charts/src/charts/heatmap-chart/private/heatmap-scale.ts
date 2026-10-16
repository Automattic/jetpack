import { contrastRatio } from '../../../providers/chart-context/private/perceptual-color';
import { mixHexColors, relativeLuminance } from '../../../utils/color-utils';

/** Contrast the lowest step aims for against the background and the empty cell. */
export const HEATMAP_LOW_CONTRAST = 2.5;

/** Contrast every step keeps against the background, and the lowest against the highest. */
export const HEATMAP_STEP_CONTRAST = 2;

/** Contrast the highest step aims for against the background, so the steps stay apart. */
export const HEATMAP_HIGH_CONTRAST = 6;

const STEPS = 200;

export type HeatmapScale = {
	low: string;
	high: string;
};

// Mixed to the rounded hex the browser paints, so an endpoint never lands under its threshold.
const ramp = ( from: string, to: string ) =>
	Array.from( { length: STEPS + 1 }, ( _, step ) => mixHexColors( from, to, step / STEPS ) );

/**
 * The two ends of the heatmap fill scale: toward 2.5:1 against the background and the empty cell at
 * the low end, never under 2:1 against the background or the high end, and toward 6:1 at the high end.
 *
 * @param primary    - The resolved primary color, as six-digit hex.
 * @param background - The resolved chart background, as six-digit hex.
 * @param emptyCell  - The resolved empty-cell color, as six-digit hex, when it is opaque.
 * @return The scale ends, as six-digit hex.
 */
export const getHeatmapScale = (
	primary: string,
	background: string,
	emptyCell?: string | null
): HeatmapScale => {
	const backgroundLuminance = relativeLuminance( background );
	const ownSide = relativeLuminance( primary ) > backgroundLuminance ? '#ffffff' : '#000000';
	const otherSide = ownSide === '#ffffff' ? '#000000' : '#ffffff';
	// The scale deepens on the primary's own side of the background, unless only the other side
	// reaches the high end or contrasts more; it never crosses the background either way.
	const extreme =
		contrastRatio( ownSide, background ) >= HEATMAP_HIGH_CONTRAST ||
		contrastRatio( ownSide, background ) >= contrastRatio( otherSide, background )
			? ownSide
			: otherSide;
	const onExtremeSide = ( color: string ) =>
		extreme === '#ffffff'
			? relativeLuminance( color ) > backgroundLuminance
			: relativeLuminance( color ) < backgroundLuminance;

	const deepening = ramp( primary, extreme );
	// Only `high` can miss its target: black or white tops out near 4.58:1 on a mid-tone background.
	const high =
		deepening.find( color => contrastRatio( color, background ) >= HEATMAP_HIGH_CONTRAST ) ??
		extreme;

	const path = [ ...ramp( background, primary ), ...deepening ];
	// Never empty: `high` sits at least 4.58:1 out.
	const spread = path
		.slice( 0, path.indexOf( high ) + 1 )
		.filter(
			color =>
				onExtremeSide( color ) &&
				contrastRatio( color, background ) >= HEATMAP_STEP_CONTRAST &&
				contrastRatio( color, high ) >= HEATMAP_STEP_CONTRAST
		);
	const surroundings = emptyCell ? [ background, emptyCell ] : [ background ];
	const weakest = ( color: string ) =>
		Math.min( ...surroundings.map( other => contrastRatio( color, other ) ) );
	// Short of 2.5:1 the low end settles for 2:1, then for the step farthest from its nearest neighbor.
	const low =
		spread.find( color => weakest( color ) >= HEATMAP_LOW_CONTRAST ) ??
		spread.find( color => weakest( color ) >= HEATMAP_STEP_CONTRAST ) ??
		spread.reduce( ( best, color ) => ( weakest( color ) > weakest( best ) ? color : best ) );

	return { low, high };
};
