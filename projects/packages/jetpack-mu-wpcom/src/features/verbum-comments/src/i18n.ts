declare global {
	interface Window {
		VerbumComments: Record< string, string >;
	}
}

/**
 * Translates a string.
 * @param string - The string to translate.
 */
export function translate( string: string ) {
	return window.VerbumComments?.[ string ] ?? string;
}
