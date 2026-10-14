import { MIN_BACKGROUND_CONTRAST } from '../../../providers/chart-context/private/palette-generator';
import { contrastRatio } from '../../../providers/chart-context/private/perceptual-color';
import { isValidHexColor, mixHexColors } from '../../../utils/color-utils';
import { OVERLAP_TINT_KEEPS } from './overlap-constants';

export type OverlapColors = {
	outerFill: string;
	outerOutline: string;
	innerFill: string;
};

/**
 * Tints the outer series toward the background, keeping the most color that still
 * separates it from the inner bar at 3:1 (WCAG 1.4.11).
 *
 * @param params            - The colors to derive from.
 * @param params.outer      - Outer series hex color.
 * @param params.inner      - Inner series hex color.
 * @param params.background - Opaque chart background hex color.
 * @return The overlap colors, or null when 3:1 cannot be kept.
 */
export function getOverlapColors( params: {
	outer: string;
	inner: string;
	background: string;
} ): OverlapColors | null {
	const { outer, inner, background } = params;

	if ( ! [ outer, inner, background ].every( isValidHexColor ) ) {
		return null;
	}

	// The outline is what separates the light outer bar from the background.
	if ( contrastRatio( outer, background ) < MIN_BACKGROUND_CONTRAST ) {
		return null;
	}

	const outerFill = OVERLAP_TINT_KEEPS.map( keep =>
		mixHexColors( outer, background, 1 - keep )
	).find( tint => contrastRatio( inner, tint ) >= MIN_BACKGROUND_CONTRAST );

	return outerFill ? { outerFill, outerOutline: outer, innerFill: inner } : null;
}
