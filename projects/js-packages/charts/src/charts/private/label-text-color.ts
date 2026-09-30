import { color as d3Color } from '@visx/vendor/d3-color';
import { CATALOG_POINTERS } from '../../providers/chart-context/private/catalog-pointers';
import { MIN_LABEL_CONTRAST } from '../../providers/chart-context/private/palette-generator';
import {
	luminanceContrastRatio,
	rgbLuminance,
} from '../../providers/chart-context/private/perceptual-color';
import { isValidHexColor, normalizeColorToHex } from '../../utils/color-utils';
import type { Rgb } from '../../providers/chart-context/private/perceptual-color';

/** Which color a label drawn on a fill paints with: one of the two catalog roles, or the black/white floor. */
export type LabelTextColor = 'label' | 'label-inverse' | 'black' | 'white';

/** A label role as the chart's own element resolves it. `unreadable` keeps the raw value, which CSS may still paint. */
export type ResolvedRole =
	{ kind: 'color'; rgb: Rgb; alpha: number } | { kind: 'unreadable'; raw: string | null };

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
	// d3 gives `transparent` NaN channels; with no alpha they never reach the composite anyway.
	const { r, g, b } = parsed.opacity > 0 ? parsed.rgb() : { r: 0, g: 0, b: 0 };
	return { kind: 'color', rgb: [ r, g, b ], alpha: parsed.opacity };
};

const sameRole = ( first: ResolvedRole, second: ResolvedRole ): boolean => {
	if ( first.kind === 'color' && second.kind === 'color' ) {
		return first.alpha === second.alpha && first.rgb.every( ( c, i ) => c === second.rgb[ i ] );
	}
	if ( first.kind === 'unreadable' && second.kind === 'unreadable' ) {
		return first.raw === second.raw;
	}
	return false;
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

// Text with alpha shows the fill through it, so it is measured as the blend the browser paints.
const roleContrast = ( role: ResolvedRole, fill: Rgb, fillLuminance: number ): number => {
	if ( role.kind === 'unreadable' ) {
		return 0;
	}
	const painted = role.rgb.map(
		( channel, i ) => role.alpha * channel + ( 1 - role.alpha ) * fill[ i ]
	) as unknown as Rgb;
	return luminanceContrastRatio( fillLuminance, rgbLuminance( painted ) );
};

/**
 * Picks the label color for text drawn on a fill: the role that contrasts more, or black/white when neither reaches AA.
 *
 * Both roles set to one color is a host's choice to keep that color, so it never falls back.
 *
 * @param fill        - The fill the text sits on, as unrounded sRGB channels.
 * @param roles       - The label roles resolved at the chart's element, or null before they are read.
 * @param defaultRole - The role the chart's stylesheet paints when nothing can be decided.
 * @return The color the label should paint with.
 */
export const pickLabelTextColorForFill = (
	fill: Rgb,
	roles: LabelRoles | null,
	defaultRole: 'label' | 'label-inverse'
): LabelTextColor => {
	if ( ! roles || sameRole( roles.label, roles.labelInverse ) ) {
		return defaultRole;
	}

	const fillLuminance = rgbLuminance( fill );
	const labelContrast = roleContrast( roles.label, fill, fillLuminance );
	const inverseContrast = roleContrast( roles.labelInverse, fill, fillLuminance );
	if ( Math.max( labelContrast, inverseContrast ) >= MIN_LABEL_CONTRAST ) {
		return labelContrast > inverseContrast ? 'label' : 'label-inverse';
	}

	// On any opaque fill one of these reaches at least 4.58:1.
	return luminanceContrastRatio( fillLuminance, 0 ) > luminanceContrastRatio( fillLuminance, 1 )
		? 'black'
		: 'white';
};

/**
 * `pickLabelTextColorForFill` for a fill given as a color.
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
	if ( ! isValidHexColor( fillHex ) ) {
		return defaultRole;
	}
	const rgb = [ 1, 3, 5 ].map( start =>
		parseInt( fillHex.slice( start, start + 2 ), 16 )
	) as unknown as Rgb;
	return pickLabelTextColorForFill( rgb, roles, defaultRole );
};
