/*
 * Get the starting text index of a node's content within its parent's text content.
 * Used to determine the position of a highlight within a sentence.
 */
export const getNodeTextIndex = ( parent: HTMLElement, node: HTMLElement ) => {
	const nodes = Array.from( parent.childNodes );
	const nodePosition = nodes.indexOf( node );

	const nodesBefore = nodes.slice( 0, nodePosition );
	const container = document.createElement( 'div' );

	nodesBefore.forEach( n => container.appendChild( n.cloneNode( true ) ) );

	return container.innerText.length;
};
