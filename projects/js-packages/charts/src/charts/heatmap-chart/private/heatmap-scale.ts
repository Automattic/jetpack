import { MIN_BACKGROUND_CONTRAST } from '../../../providers/chart-context/private/palette-generator';
import { contrastRatio } from '../../../providers/chart-context/private/perceptual-color';
import { mixHexColors, relativeLuminance } from '../../../utils/color-utils';

/** Contrast the highest step aims for against the background, so the steps stay apart. */
export const HEATMAP_HIGH_CONTRAST = 9;

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
 * low end, toward 9:1 against the background at the high end.
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
	// The lowest step sits beside empty cells, so it has to stand apart from them too.
	const low =
		( emptyCell ? lowAgainst( [ background, emptyCell ] ) : null ) ?? lowAgainst( [ background ] );
	const high = firstMeeting(
		primary,
		extreme,
		color => contrastRatio( color, background ) >= HEATMAP_HIGH_CONTRAST
	);

	// Only `high` can miss: black or white tops out near 4.58:1 on a mid-tone background.
	return { low: low ?? extreme, high: high ?? extreme };
};
