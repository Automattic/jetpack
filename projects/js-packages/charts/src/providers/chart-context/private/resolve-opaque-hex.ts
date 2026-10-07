import { color as d3Color } from '@visx/vendor/d3-color';
import { isValidHexColor, normalizeColorToHex } from '../../../utils/color-utils';

// A see-through color (transparent, or any alpha below 1) says nothing about what it will look like
// over the chart, so it resolves to null rather than let its RGB stand in for the color.
export const resolveOpaqueHex = (
	pointer: string,
	resolve: ( value: string ) => string | null
): string | null => {
	const raw = resolve( pointer );
	if ( ! raw || d3Color( raw )?.opacity !== 1 ) {
		return null;
	}
	const hex = normalizeColorToHex( raw );
	return isValidHexColor( hex ) ? hex : null;
};
