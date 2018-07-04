/*
 * Returns a text node inside a DOM node, using an absolute position.
 */
const getTextNodeAtPosition = function( rootElement, position ) {
	// Iterates over the passed element children nodes
	const dontExpandEntityReferences = false;
	const treeWalker = document.createTreeWalker( rootElement, NodeFilter.SHOW_TEXT, function next( childElement ) {
		// if position it's bigger than this node's length, we keep searching...
		if ( position > childElement.textContent.length ) {
			position -= childElement.textContent.length;
			return NodeFilter.FILTER_REJECT;
		}

		return NodeFilter.FILTER_ACCEPT;
	}, /* required by IE 11 */ dontExpandEntityReferences );

	const nextNode = treeWalker.nextNode();

	return {
		node: nextNode ? nextNode : rootElement,
		position: nextNode ? position : 0
	};
};

const getCaretPositionForElement = function( element ) {
	const selection = window.getSelection();
	const selectionRange = selection.getRangeAt( 0 );
	selectionRange.setStart( element, 0 );

	return selectionRange.toString().length;
};

const restoreCaretPositionForElement = function( element, caretOffset ) {
	const selection = window.getSelection();
	// retrieves the text node to set the caret position to, and the
	// relative position the caret should move to.
	const textNodeAndPosition = getTextNodeAtPosition( element, caretOffset );
	selection.removeAllRanges();

	const restorationRange = document.createRange();
	restorationRange.setStart( textNodeAndPosition.node, textNodeAndPosition.position );
	selection.addRange( restorationRange );
};

export default class CaretManager {

	savePosition( element ) {
		this.caretOffset = getCaretPositionForElement( element );
	}

	restorePosition( element ) {
		restoreCaretPositionForElement( element, this.caretOffset );
	}
}

