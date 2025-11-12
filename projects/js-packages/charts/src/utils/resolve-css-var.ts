/**
 * Resolves a CSS custom property (variable) to its computed value
 *
 * @param cssVar - A CSS variable string like 'var(--my-color)'
 * @return The computed value or null if invalid
 */
export const resolveCssVariable = ( cssVar: string ): string | null => {
	if ( typeof window === 'undefined' || typeof document === 'undefined' ) {
		return null;
	}

	if ( cssVar.length > 1000 ) {
		throw new Error( 'CSS variable is too long' );
	}

	// Extract the variable name from var(--variable-name)
	const match = cssVar.match( /var\(\s*(--[^),\s]+)\s*(?:,\s*([^)]+))?\s*\)/ );
	if ( ! match ) {
		return null;
	}

	const varName = match[ 1 ];
	const fallback = match[ 2 ];

	// Get computed style from root element
	const computedValue = getComputedStyle( document.documentElement )
		.getPropertyValue( varName )
		.trim();

	return computedValue || fallback || null;
};
