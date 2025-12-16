/**
 * Resolves a CSS custom property (variable) to its computed value
 *
 * @param varName - A CSS variable name like '--my-color'
 * @param element - Optional DOM element to resolve the variable from (defaults to document.documentElement)
 * @return The computed value or null if invalid/not found
 */
export const resolveCssVariable = (
	varName: string,
	element?: HTMLElement | null
): string | null => {
	if ( typeof window === 'undefined' || typeof document === 'undefined' ) {
		return null;
	}

	// Validate variable name format (must start with --)
	if ( ! varName.startsWith( '--' ) ) {
		return null;
	}

	// Get computed style from the specified element or document root
	try {
		const targetElement = element || document.documentElement;
		const computedValue = getComputedStyle( targetElement ).getPropertyValue( varName ).trim();

		return computedValue || null;
	} catch {
		// Return null if getComputedStyle throws (e.g., detached element)
		return null;
	}
};
