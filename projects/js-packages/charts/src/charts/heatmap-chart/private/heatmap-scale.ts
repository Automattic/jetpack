import { MIN_BACKGROUND_CONTRAST } from '../../../providers/chart-context/private/palette-generator';
import { contrastRatio } from '../../../providers/chart-context/private/perceptual-color';
import { mixHexColors, relativeLuminance } from '../../../utils/color-utils';

/** Contrast the highest step aims for against the background, so the steps stay apart. */
export const HEATMAP_HIGH_CONTRAST = 9;

/** Least contrast between the lowest and highest steps, so the scale never flattens. */
export const HEATMAP_MIN_SPREAD = 2;

const STEPS = 200;

export type HeatmapScale = {
	low: string;
	high: string;
};

// Measured on the rounded hex the browser paints, so an endpoint never lands under its threshold.
const firstMeeting = ( from: string, to: string, meets: ( color: string ) => boolean ) => {
	for ( let step = 0; step <= STEPS; step++ ) {
		const color = mixHexColors( from, to, step / STEPS );
		if ( meets( color ) ) {
			return color;
		}
	}
	return null;
};

/**
 * The two ends of the heatmap fill scale: 3:1 against the background and the empty cell at the
 * low end, toward 9:1 against the background and at least 2:1 against the low end at the high end.
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
	const primaryStandsOut = contrastRatio( primary, background ) >= MIN_BACKGROUND_CONTRAST;
	// The scale deepens to black or white on the primary's own side of the background, so it never
	// crosses it. A primary too close to the background takes whichever contrasts more.
	const towardWhite = primaryStandsOut
		? relativeLuminance( primary ) > relativeLuminance( background )
		: contrastRatio( '#ffffff', background ) > contrastRatio( '#000000', background );
	const extreme = towardWhite ? '#ffffff' : '#000000';

	const lowAgainst = ( references: string[] ) => {
		const meets = ( color: string ) =>
			references.every( reference => contrastRatio( color, reference ) >= MIN_BACKGROUND_CONTRAST );
		return (
			( primaryStandsOut ? firstMeeting( background, primary, meets ) : null ) ??
			firstMeeting( primary, extreme, meets )
		);
	};
	// The high end deepens past 9:1 when the low end sits close to it, as on a dark empty cell.
	const highAbove = ( low: string ) => {
		const apart = ( color: string ) =>
			contrastRatio( color, background ) > contrastRatio( low, background ) &&
			contrastRatio( color, low ) >= HEATMAP_MIN_SPREAD;
		// Black or white tops out near 4.58:1 on a mid-tone background, short of 9:1.
		return (
			firstMeeting(
				primary,
				extreme,
				color => apart( color ) && contrastRatio( color, background ) >= HEATMAP_HIGH_CONTRAST
			) ?? ( apart( extreme ) ? extreme : null )
		);
	};

	// The lowest step sits beside empty cells, so it stands apart from them too, unless an
	// empty-cell color far from the background leaves no room above it for the rest of the scale.
	const againstEmptyCell = emptyCell ? lowAgainst( [ background, emptyCell ] ) : null;
	const highAboveEmptyCell = againstEmptyCell && highAbove( againstEmptyCell );
	if ( againstEmptyCell && highAboveEmptyCell ) {
		return { low: againstEmptyCell, high: highAboveEmptyCell };
	}

	const low = lowAgainst( [ background ] ) ?? extreme;
	return { low, high: highAbove( low ) ?? extreme };
};
