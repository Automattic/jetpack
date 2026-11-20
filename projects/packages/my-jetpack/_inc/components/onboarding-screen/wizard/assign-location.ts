/* istanbul ignore file */ // Exists to be mocked: jsdom refuses to let `location` be replaced.

/**
 * Send the browser somewhere.
 *
 * A module of its own for the same reason the connection package has one: jsdom
 * makes both `location` and its `href` non-configurable, so a test can only see
 * where the wizard tried to go by replacing this.
 *
 * @param url - Where to go.
 */
export function assignLocation( url: string ): void {
	window.location.assign( url );
}
