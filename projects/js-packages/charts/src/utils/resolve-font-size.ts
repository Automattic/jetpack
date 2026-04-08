/**
 * Resolve a theme `fontSize` value (which can be either a number or a
 * CSS length string like `"12px"`) into a plain number suitable for
 * measurement calculations such as `getStringWidth`.
 *
 * Returns `undefined` when the value is missing or cannot be parsed,
 * so callers can fall back to their own default.
 * @param val - Raw font size value from a theme, axis style, or props
 * @return Parsed numeric font size, or `undefined` when unresolvable
 */
export const resolveFontSize = ( val?: number | string ): number | undefined => {
	if ( typeof val === 'number' && ! isNaN( val ) ) {
		return val;
	}

	if ( typeof val === 'string' ) {
		const parsed = parseFloat( val );
		return isNaN( parsed ) ? undefined : parsed;
	}

	return undefined;
};
