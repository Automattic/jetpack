/**
 * Resolves a CSS custom property (variable) to its computed value
 *
 * @param cssVar  - A CSS variable string like 'var(--my-color)' or 'var(--my-color, fallback)'
 * @param element - Optional DOM element to resolve the variable from (defaults to document.documentElement)
 * @return The computed value or null if invalid
 */
export const resolveCssVariable = (
	cssVar: string,
	element?: HTMLElement | null
): string | null => {
	if ( typeof window === 'undefined' || typeof document === 'undefined' ) {
		return null;
	}

	if ( cssVar.length > 1000 ) {
		throw new Error( 'CSS variable is too long' );
	}

	// Check for basic var() structure
	if ( ! cssVar.startsWith( 'var(' ) || ! cssVar.endsWith( ')' ) ) {
		return null;
	}

	// Remove 'var(' and trailing ')'
	const content = cssVar.slice( 4, -1 ).trim();

	// Extract variable name and fallback by parsing with paren counting
	let varName = '';
	let fallback: string | undefined;
	let parenDepth = 0;
	let commaIndex = -1;

	for ( let i = 0; i < content.length; i++ ) {
		const char = content[ i ];

		if ( char === '(' ) {
			parenDepth++;
		} else if ( char === ')' ) {
			parenDepth--;
		} else if ( char === ',' && parenDepth === 0 && commaIndex === -1 ) {
			// Found the comma separating variable from fallback
			commaIndex = i;
		}
	}

	if ( commaIndex === -1 ) {
		// No fallback value
		varName = content.trim();
	} else {
		// Has fallback value
		varName = content.slice( 0, commaIndex ).trim();
		fallback = content.slice( commaIndex + 1 ).trim();
	}

	// Validate variable name format (must start with -- and contain no invalid characters)
	if ( ! varName.startsWith( '--' ) || /[,()\s]/.test( varName ) ) {
		return null;
	}

	// Get computed style from the specified element or document root
	const targetElement = element || document.documentElement;
	const computedValue = getComputedStyle( targetElement ).getPropertyValue( varName ).trim();

	return computedValue || fallback?.trim() || null;
};
