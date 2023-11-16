/**
 * Parse a pseudo-HTML string into a DOM - useful for templating. Note: tag
 * names are case sensitive!
 *
 * @param {string} source
 * @return {Node} Virtual root node of parsed document.
 */
export function parsePseudoHTML( source: string ): Node {
	/**
	 * <PseudoHTML> bears no actual significance as it's a temporary XML
	 * element used as a wrapper to make DOMParser cooperate
	 * and return child nodes.
	 */
	const wrappedTemplate = '<PseudoHTML>' + source + '</PseudoHTML>';

	// Use browser parser to build DOM.
	const doc = new DOMParser().parseFromString( wrappedTemplate, 'application/xml' );

	// Return the root PseudoHTML node.
	return doc.childNodes[ 0 ];
}
