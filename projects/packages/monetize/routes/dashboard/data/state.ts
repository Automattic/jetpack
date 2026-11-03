declare global {
	interface Window {
		jetpackMonetizeDashboard?: Record< string, unknown >;
	}
}

/**
 * The state PHP printed for a section.
 *
 * @param key - The section's key.
 * @return The section's state, or undefined when the section isn't registered.
 */
export function getSectionState< T >( key: string ): T | undefined {
	return window.jetpackMonetizeDashboard?.[ key ] as T | undefined;
}
