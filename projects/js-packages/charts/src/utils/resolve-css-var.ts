/**
 * Pattern for valid CSS custom property names (e.g., '--my-color', '--jp-gray-10')
 */
const CSS_VAR_NAME_PATTERN = /^--[\w-]+$/;

/**
 * Builds a resolver that reads every value from one `getComputedStyle` snapshot.
 *
 * `getComputedStyle` is the expensive half of resolving a token: each call can force the browser to flush pending style, and a chart theme resolves five roles at once. Taking the snapshot once per build turns that into a single query. The reads that share a snapshot happen synchronously inside one memo body, so no style change can land between them — the resolver is single-pass by design and is not meant to be held across renders.
 *
 * @param element - The element to resolve against, or null/undefined for the document root.
 * @return A resolver that resolves each value exactly as `resolveCssVariable` does.
 */
export const createCssVariableResolver = (
	element?: HTMLElement | null
): ( ( value: string ) => string | null ) => {
	let styles: CSSStyleDeclaration | null = null;

	// Deferred so a resolver for a theme that turns out to hold only literals costs nothing. Only a successful read is kept: caching the null would leave a resolver built before its element is in the document dead for the rest of its life.
	const getStyles = () => {
		if ( ! styles ) {
			styles = computedStyleFor( element );
		}

		return styles;
	};

	return value => {
		if ( ! value ) {
			return null;
		}

		// Check if it's a var() expression: var(--name) or var(--name, fallback)
		// Parse manually to avoid regex backtracking vulnerabilities
		if ( value.startsWith( 'var(' ) && value.endsWith( ')' ) ) {
			const parsed = parseVarExpression( value );

			if ( parsed ) {
				const resolved = readCustomProperty( parsed.varName, getStyles() );

				return resolved || parsed.fallback;
			}
		}

		// Check if it's a plain variable name (starts with --)
		if ( value.startsWith( '--' ) ) {
			return readCustomProperty( value, getStyles() );
		}

		// Return regular values as-is (e.g., '#ffffff', 'red')
		return value;
	};
};

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
export const resolveCssVariable = ( value: string, element?: HTMLElement | null ): string | null =>
	createCssVariableResolver( element )( value );

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
 * Takes one computed-style snapshot, or null where there is nothing to read (SSR, or a detached element).
 *
 * @param element - The element to read from, or null/undefined for the document root.
 * @return The computed styles, or null.
 */
function computedStyleFor( element?: HTMLElement | null ): CSSStyleDeclaration | null {
	if ( typeof window === 'undefined' || typeof document === 'undefined' ) {
		return null;
	}

	try {
		return getComputedStyle( element || document.documentElement );
	} catch {
		// getComputedStyle throws on a detached element.
		return null;
	}
}

/**
 * Reads one custom property from a computed-style snapshot.
 *
 * @param varName - A CSS variable name like '--my-color'
 * @param styles  - The snapshot to read from, or null
 * @return The computed value or null
 */
function readCustomProperty( varName: string, styles: CSSStyleDeclaration | null ): string | null {
	if ( ! styles ) {
		return null;
	}

	try {
		const computedValue = styles.getPropertyValue( varName ).trim();

		return computedValue || null;
	} catch {
		// Belt and braces — no engine is known to throw here. Kept because a caller may hand in a stand-in for CSSStyleDeclaration; `resolve-css-var.test.ts` covers exactly that.
		return null;
	}
}
