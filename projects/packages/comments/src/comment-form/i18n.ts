declare global {
	interface Window {
		VerbumComments: Record< string, string >;
	}
}

/**
 * Translates a string.
 * @param {string} string - The string to translate.
 * @return {string} The translated string, or original string if no translation is found.
 */
export function translate( string: string ): string {
	return window.VerbumComments?.[ string ] ?? string;
}
