/**
 * Pattern for valid CSS custom property names (e.g., '--my-color', '--jp-gray-10')
 */
const CSS_VAR_NAME_PATTERN = /^--[\w-]+$/;

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
	// Parse manually to avoid regex backtracking vulnerabilities
	if ( value.startsWith( 'var(' ) && value.endsWith( ')' ) ) {
		const parsed = parseVarExpression( value );

		if ( parsed ) {
			const resolved = resolveVariableName( parsed.varName, element );

			return resolved || parsed.fallback;
		}
	}

	// Check if it's a plain variable name (starts with --)
	if ( value.startsWith( '--' ) ) {
		return resolveVariableName( value, element );
	}

	// Return regular values as-is (e.g., '#ffffff', 'red')
	return value;
};

/**
 * Parses a var() expression into its variable name and optional fallback.
 * Uses string manipulation instead of complex regex to avoid ReDoS.
 *
 * @param expr - A var() expression like 'var(--name)' or 'var(--name, fallback)'
 * @return Parsed result or null if invalid
 */
function parseVarExpression( expr: string ): { varName: string; fallback: string | null } | null {
	// Remove 'var(' prefix and ')' suffix
	const inner = expr.slice( 4, -1 ).trim();

	if ( ! inner.startsWith( '--' ) ) {
		return null;
	}

	// Find the comma separator (if any)
	const commaIndex = inner.indexOf( ',' );

	if ( commaIndex === -1 ) {
		// No fallback: var(--name)
		const varName = inner.trim();
		// Validate variable name format
		if ( ! CSS_VAR_NAME_PATTERN.test( varName ) ) {
			return null;
		}

		return { varName, fallback: null };
	}

	// Has fallback: var(--name, fallback)
	const varName = inner.slice( 0, commaIndex ).trim();

	// Validate variable name format
	if ( ! CSS_VAR_NAME_PATTERN.test( varName ) ) {
		return null;
	}

	const fallback = inner.slice( commaIndex + 1 ).trim();

	return { varName, fallback: fallback || null };
}

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
