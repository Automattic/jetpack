/**
 * Resolve a theme `fontSize` value into a plain number suitable for
 * canvas-based measurement (e.g. `getStringWidth`).
 *
 * Accepts:
 * - A number — returned as-is
 * - A pixel string like `"12px"` — parsed and returned as a number
 *
 * Returns `undefined` for any other input (missing value, NaN, or
 * relative units like `rem`/`em`/`%`/`vh`) so callers can fall back to
 * their own default. Relative units are intentionally rejected because
 * we cannot resolve them to absolute pixels here without a parent
 * computed style, and silently returning the unitless prefix
 * (`parseFloat("0.875rem") === 0.875`) would produce nearly-zero
 * widths in measurement code.
 * @param val - Raw font size value from a theme, axis style, or props
 * @return Parsed numeric font size in pixels, or `undefined` when unresolvable
 */
export const resolveFontSize = ( val?: number | string ): number | undefined => {
	if ( typeof val === 'number' ) {
		return isNaN( val ) ? undefined : val;
	}

	if ( typeof val === 'string' ) {
		// Only accept plain numeric strings or pixel values.
		// Reject rem, em, %, vh, vw, etc. — they cannot be resolved to
		// absolute pixels without a computed style context.
		const match = val.trim().match( /^(-?\d+\.?\d*|-?\.\d+)(px)?$/ );
		if ( ! match ) {
			return undefined;
		}
		const parsed = parseFloat( match[ 1 ] );
		return isNaN( parsed ) ? undefined : parsed;
	}

	return undefined;
};
