/**
 * Extract the pathname from a URL string for display.
 *
 * @param url - Absolute or relative URL.
 * @return Pathname, or null when invalid.
 */
export function getUrlPath( url: string ): string | null {
	try {
		return new URL( url, window.location.origin ).pathname;
	} catch {
		return null;
	}
}
