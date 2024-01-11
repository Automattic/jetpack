/**
 * Returns true if the given URL is from the same origin as the current page.
 *
 * @param {string} url URL to check.
 */
export function isSameOrigin( url: string ): boolean {
	return new URL( url ).origin === window.location.origin;
}
