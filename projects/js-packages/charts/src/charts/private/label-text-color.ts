import { color as d3Color } from '@visx/vendor/d3-color';
import { CATALOG_POINTERS } from '../../providers/chart-context/private/catalog-pointers';
import { MIN_LABEL_CONTRAST } from '../../providers/chart-context/private/palette-generator';
import { luminanceContrastRatio } from '../../providers/chart-context/private/perceptual-color';
import { isValidHexColor, normalizeColorToHex, relativeLuminance } from '../../utils/color-utils';

/** Which color a label drawn on a fill paints with: one of the two catalog roles, or the black/white floor. */
export type LabelTextColor = 'label' | 'label-inverse' | 'black' | 'white';

/** A label role as the chart's own element resolves it. `unreadable` keeps the raw value, which CSS may still paint. */
export type ResolvedRole =
	| { kind: 'opaque'; hex: string }
	| { kind: 'see-through' }
	| { kind: 'unreadable'; raw: string | null };

export interface LabelRoles {
	label: ResolvedRole;
	labelInverse: ResolvedRole;
}

const resolveRole = (
	pointer: string,
	resolve: ( value: string ) => string | null
): ResolvedRole => {
	const raw = resolve( pointer );
	// d3 reads no CSS Color 4 syntax (`rgb(0 0 0)`, `oklch()`), though the browser paints it.
	const parsed = raw ? d3Color( raw ) : null;
	if ( ! parsed ) {
		return { kind: 'unreadable', raw };
	}
	// Hex drops alpha, so a see-through role would otherwise win the comparison and paint nothing.
	if ( parsed.opacity < 1 ) {
		return { kind: 'see-through' };
	}
	const hex = normalizeColorToHex( pointer, null, resolve );
	return isValidHexColor( hex )
		? { kind: 'opaque', hex: hex.toLowerCase() }
		: { kind: 'unreadable', raw };
};

const sameRole = ( first: ResolvedRole, second: ResolvedRole ): boolean => {
	if ( first.kind === 'opaque' && second.kind === 'opaque' ) {
		return first.hex === second.hex;
	}
	if ( first.kind === 'unreadable' && second.kind === 'unreadable' ) {
		return first.raw === second.raw;
	}
	return first.kind === second.kind;
};

/**
 * Reads both label roles at the element the label text inherits from, so JS and CSS agree on what paints.
 *
 * @param resolve - A CSS variable resolver bound to that element.
 * @return The resolved label roles.
 */
export const resolveLabelRoles = ( resolve: ( value: string ) => string | null ): LabelRoles => ( {
	label: resolveRole( CATALOG_POINTERS.label, resolve ),
	labelInverse: resolveRole( CATALOG_POINTERS.labelInverse, resolve ),
} );

/**
 * Whether two resolved label role pairs would paint the same.
 *
 * @param first  - One pair, or null.
 * @param second - The other pair, or null.
 * @return True when both are null or both roles match.
 */
export const sameLabelRoles = ( first: LabelRoles | null, second: LabelRoles | null ): boolean =>
	first === second ||
	( !! first &&
		!! second &&
		sameRole( first.label, second.label ) &&
		sameRole( first.labelInverse, second.labelInverse ) );

// On any opaque fill one of these reaches at least 4.58:1.
const blackOrWhite = ( fillLuminance: number ): LabelTextColor =>
	luminanceContrastRatio( fillLuminance, 0 ) > luminanceContrastRatio( fillLuminance, 1 )
		? 'black'
		: 'white';

/**
 * Picks the label color for text drawn on a fill: the role that contrasts more, or black/white when neither reaches AA.
 *
 * Both roles set to one color is a host's choice to keep that color, so it never falls back.
 *
 * @param fillLuminance - Relative luminance of the fill the text sits on.
 * @param roles         - The label roles resolved at the chart's element, or null before they are read.
 * @param defaultRole   - The role the chart's stylesheet paints when nothing can be decided.
 * @return The color the label should paint with.
 */
export const pickLabelTextColorForLuminance = (
	fillLuminance: number,
	roles: LabelRoles | null,
	defaultRole: 'label' | 'label-inverse'
): LabelTextColor => {
	if ( ! roles || sameRole( roles.label, roles.labelInverse ) ) {
		return defaultRole;
	}

	const { label, labelInverse } = roles;
	if ( label.kind === 'see-through' ) {
		return 'label-inverse';
	}
	if ( labelInverse.kind === 'see-through' ) {
		return 'label';
	}
	// A role JS cannot read cannot be measured, so only the floor is known to pass.
	if ( label.kind === 'unreadable' || labelInverse.kind === 'unreadable' ) {
		return blackOrWhite( fillLuminance );
	}

	const labelContrast = luminanceContrastRatio( fillLuminance, relativeLuminance( label.hex ) );
	const inverseContrast = luminanceContrastRatio(
		fillLuminance,
		relativeLuminance( labelInverse.hex )
	);
	if ( Math.max( labelContrast, inverseContrast ) >= MIN_LABEL_CONTRAST ) {
		return labelContrast > inverseContrast ? 'label' : 'label-inverse';
	}

	return blackOrWhite( fillLuminance );
};

/**
 * `pickLabelTextColorForLuminance` for a fill given as a color.
 *
 * @param fill        - The fill, in any color syntax `normalizeColorToHex` reads.
 * @param roles       - The label roles resolved at the chart's element, or null before they are read.
 * @param defaultRole - The role the chart's stylesheet paints when nothing can be decided.
 * @return The color the label should paint with.
 */
export const pickLabelTextColor = (
	fill: string,
	roles: LabelRoles | null,
	defaultRole: 'label' | 'label-inverse'
): LabelTextColor => {
	const fillHex = normalizeColorToHex( fill );
	return isValidHexColor( fillHex )
		? pickLabelTextColorForLuminance( relativeLuminance( fillHex ), roles, defaultRole )
		: defaultRole;
};
