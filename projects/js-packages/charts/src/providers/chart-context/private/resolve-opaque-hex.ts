import { color as d3Color } from '@visx/vendor/d3-color';
import { isValidHexColor, normalizeColorToHex } from '../../../utils/color-utils';
import { resolveCssVariable } from '../../../utils/resolve-css-var';

// A see-through color (transparent, or any alpha below 1) says nothing about what it will look like
// over the chart, so it resolves to null rather than let its RGB leak into the palette.
export const resolveOpaqueHex = ( pointer: string, element: HTMLElement | null ): string | null => {
	const raw = resolveCssVariable( pointer, element );
	if ( ! raw || d3Color( raw )?.opacity !== 1 ) {
		return null;
	}
	const hex = normalizeColorToHex( pointer, element, resolveCssVariable );
	return isValidHexColor( hex ) ? hex : null;
};
