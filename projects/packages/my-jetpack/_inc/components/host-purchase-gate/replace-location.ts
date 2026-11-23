/* istanbul ignore file */ // Exists to be mocked: jsdom refuses to let `location` be replaced.

/**
 * Send the browser somewhere, leaving no history entry for the page it left.
 *
 * @param url - Where to go.
 */
export function replaceLocation( url: string ): void {
	window.location.replace( url );
}
