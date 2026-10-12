import { contrastRatio } from '../../../providers/chart-context/private/perceptual-color';
import { mixHexColors, relativeLuminance } from '../../../utils/color-utils';

/** Contrast the lowest step keeps against the background, the highest step and, where it can, the empty cell. */
export const HEATMAP_LOW_CONTRAST = 2;

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
 * The two ends of the heatmap fill scale: 2:1 against the background, the high end and, where it
 * can, the empty cell at the low end, toward 6:1 against the background at the high end.
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
	const primaryStandsOut = contrastRatio( primary, background ) >= HEATMAP_LOW_CONTRAST;
	// The scale deepens to black or white on the primary's own side of the background, so it never
	// crosses it. A primary too close to the background takes whichever contrasts more.
	const towardWhite = primaryStandsOut
		? relativeLuminance( primary ) > relativeLuminance( background )
		: contrastRatio( '#ffffff', background ) > contrastRatio( '#000000', background );
	const extreme = towardWhite ? '#ffffff' : '#000000';

	// Only `high` can miss: black or white tops out near 4.58:1 on a mid-tone background.
	const deepening = ramp( primary, extreme );
	const high =
		deepening.find( color => contrastRatio( color, background ) >= HEATMAP_HIGH_CONTRAST ) ??
		extreme;

	const path = primaryStandsOut ? [ ...ramp( background, primary ), ...deepening ] : deepening;
	const towardHigh = path.slice( 0, path.indexOf( high ) + 1 );
	const awayFromBackground = towardHigh.filter(
		color => contrastRatio( color, background ) >= HEATMAP_LOW_CONTRAST
	);
	const apartFromHigh = awayFromBackground.filter(
		color => contrastRatio( color, high ) >= HEATMAP_LOW_CONTRAST
	);
	const candidates = apartFromHigh.length ? apartFromHigh : awayFromBackground;

	// An empty-cell color the low end cannot clear without nearing the high end gives way: the low
	// end then takes the shade farthest from it that keeps the scale spread.
	const contrastWithEmptyCell = ( color: string ) =>
		emptyCell ? contrastRatio( color, emptyCell ) : Infinity;
	const low =
		candidates.find( color => contrastWithEmptyCell( color ) >= HEATMAP_LOW_CONTRAST ) ??
		candidates.reduce< string | undefined >(
			( best, color ) =>
				best === undefined || contrastWithEmptyCell( color ) > contrastWithEmptyCell( best )
					? color
					: best,
			undefined
		);

	return { low: low ?? extreme, high };
};
