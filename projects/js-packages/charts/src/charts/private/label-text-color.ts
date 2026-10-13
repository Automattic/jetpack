import { color as d3Color } from '@visx/vendor/d3-color';
import isEqual from 'fast-deep-equal';
import { CATALOG_POINTERS } from '../../providers/chart-context/private/catalog-pointers';
import { MIN_LABEL_CONTRAST } from '../../providers/chart-context/private/palette-generator';
import {
	blendRgb,
	hexToRgb,
	luminanceContrastRatio,
	rgbLuminance,
} from '../../providers/chart-context/private/perceptual-color';
import { isValidHexColor, normalizeColorToHex } from '../../utils/color-utils';
import type { Rgb } from '../../providers/chart-context/private/perceptual-color';

// The browser paints the fill on 8-bit channels, which can cost a mid-tone ~0.03 of contrast.
const ROUNDING_HEADROOM = 0.05;

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

// Text with alpha shows the fill through it, so it is measured as the blend the browser paints.
const roleContrast = ( role: ResolvedRole, fill: Rgb, fillLuminance: number ): number => {
	if ( role.kind === 'unreadable' ) {
		return 0;
	}
	return luminanceContrastRatio(
		fillLuminance,
		rgbLuminance( blendRgb( role.rgb, fill, role.alpha ) )
	);
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
	if ( ! roles || isEqual( roles.label, roles.labelInverse ) ) {
		return defaultRole;
	}

	const fillLuminance = rgbLuminance( fill );
	const labelContrast = roleContrast( roles.label, fill, fillLuminance );
	const inverseContrast = roleContrast( roles.labelInverse, fill, fillLuminance );
	if ( Math.max( labelContrast, inverseContrast ) >= MIN_LABEL_CONTRAST + ROUNDING_HEADROOM ) {
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
	return pickLabelTextColorForFill( hexToRgb( fillHex ), roles, defaultRole );
};
