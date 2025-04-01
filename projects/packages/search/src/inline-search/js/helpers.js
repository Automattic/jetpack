/**
 * Sets up JetpackSearchCorrectedQuery with the provided data.
 *
 * @param {object} data - The data to set for JetpackSearchCorrectedQuery
 */
export function setupJetpackSearchCorrectedQuery( data ) {
	Object.defineProperty( window, 'JetpackSearchCorrectedQuery', {
		value: data,
		configurable: true,
	} );
}

/**
 * Resets JetpackSearchCorrectedQuery to undefined.
 */
export function resetJetpackSearchCorrectedQuery() {
	delete window.JetpackSearchCorrectedQuery;
}

/**
 * Creates a DOM element from HTML string using Range API.
 *
 * @param {string} html - The HTML string to convert to an element
 * @return {Element} The first element from the created HTML
 */
export function createElementFromHtml( html ) {
	const range = document.createRange();
	return range.createContextualFragment( html ).firstChild;
}

/**
 * Applies styles to a DOM element.
 *
 * @param {Element} element - The element to style
 * @param {object}  styles  - Object containing style properties and values
 */
export function applyStyles( element, styles ) {
	Object.assign( element.style, styles );
}
