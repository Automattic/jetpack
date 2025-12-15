/**
 * Resolves a CSS custom property (variable) to its computed value.
 * Handles multiple formats:
 * - Plain variable names: '--my-color'
 * - CSS var() syntax: 'var(--my-color)'
 * - CSS var() with fallback: 'var(--my-color, #ffffff)'
 * - Regular values (returned as-is): '#ffffff', 'red'
 *
 * @param value   - A CSS variable name, var() expression, or regular value
 * @param element - Optional DOM element to resolve the variable from (defaults to document.documentElement)
 * @return The resolved value, fallback value, or null if unresolvable
 */
export const resolveCssVariable = (
	value: string,
	element?: HTMLElement | null
): string | null => {
	if ( ! value ) {
		return null;
	}

	// Check if it's a var() expression: var(--name) or var(--name, fallback)
	const varMatch = value.match( /^var\(\s*(--[\w-]+)\s*(?:,\s*(.+))?\s*\)$/ );

	if ( varMatch ) {
		const varName = varMatch[ 1 ];
		const fallback = varMatch[ 2 ]?.trim() || null;

		// Try to resolve the variable
		const resolved = resolveVariableName( varName, element );

		// Return resolved value, or fallback, or null
		return resolved || fallback;
	}

	// Check if it's a plain variable name (starts with --)
	if ( value.startsWith( '--' ) ) {
		return resolveVariableName( value, element );
	}

	// Return regular values as-is (e.g., '#ffffff', 'red')
	return value;
};

/**
 * Resolves a plain CSS variable name to its computed value.
 *
 * @param varName - A CSS variable name like '--my-color'
 * @param element - Optional DOM element to resolve from
 * @return The computed value or null
 */
function resolveVariableName( varName: string, element?: HTMLElement | null ): string | null {
	if ( typeof window === 'undefined' || typeof document === 'undefined' ) {
		return null;
	}

	try {
		const targetElement = element || document.documentElement;
		const computedValue = getComputedStyle( targetElement ).getPropertyValue( varName ).trim();

		return computedValue || null;
	} catch {
		// Return null if getComputedStyle throws (e.g., detached element)
		return null;
	}
}
