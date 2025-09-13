/**
 * Get the caret position in an active contenteditable element
 * From https://gist.github.com/loilo/f873a88631e660c59a1d5ab757ca9b1e
 *
 * @param {HTMLElement} target - Contenteditable element of which to get the caret position
 * @return {number} The caret position
 */
export const getCaretPosition = target => {
	const sel = target.ownerDocument.defaultView.getSelection();

	if ( sel.rangeCount === 0 ) {
		return 0;
	}

	const range = sel.getRangeAt( 0 );

	const preCaretRange = range.cloneRange();
	preCaretRange.selectNodeContents( target );
	preCaretRange.setEnd( range.endContainer, range.endOffset );

	return preCaretRange.toString().length;
};

/**
 * Move the caret position in an active contenteditable element to the end
 *
 * @param {HTMLElement} target - Contenteditable element of which to move the caret
 */
export const moveCaretToEnd = target => {
	const doc = target.ownerDocument;
	if ( 'undefined' === typeof doc ) {
		return;
	}

	// Add the contenteditable element to a new selection and collapse it to the end
	const range = doc.createRange();
	range.selectNodeContents( target );
	range.collapse( false );

	// Clear the window selection object and add the new selection
	const selection = doc.getSelection();
	selection.removeAllRanges();
	selection.addRange( range );
};
