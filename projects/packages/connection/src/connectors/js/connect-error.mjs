/**
 * Errors from the Connectors card's REST requests, and what its connect notice shows for them.
 *
 * Pure, so they can be tested without a DOM.
 *
 * @see connectors-card.js apiRequest() and JetpackConnectorCard()
 */

/**
 * The error a failed REST request throws. Keeps the response body so the connect notice can map its `code`.
 *
 * @param {object|null} body            - The parsed error response, or null when it wasn't JSON.
 * @param {string}      fallbackMessage - Message used when the response has none.
 * @return {Error} The error.
 */
export function createRequestError( body, fallbackMessage ) {
	const error = new Error( body?.message || fallbackMessage );
	if ( body && typeof body === 'object' ) {
		error.response = body;
	}
	return error;
}

/**
 * What the connect notice shows for an error from the connect flow.
 *
 * Falls back to the error's own message when the request had no response body or the shared script predates
 * `getRegistrationErrorDisplay()`.
 *
 * @param {Error}         error                       - The error the connect flow threw.
 * @param {Function|null} getRegistrationErrorDisplay - The helper from `@automattic/jetpack-connection`, if loaded.
 * @param {string}        fallbackMessage             - Message used when there's nothing better to show.
 * @return {{message: *, detail: *}} The message, and a second line or null.
 */
export function getConnectErrorDisplay( error, getRegistrationErrorDisplay, fallbackMessage ) {
	if ( error?.response && getRegistrationErrorDisplay ) {
		const { message, detail } = getRegistrationErrorDisplay( error ) ?? {};
		return { message: message || fallbackMessage, detail: detail ?? null };
	}
	return { message: error?.message || fallbackMessage, detail: null };
}
