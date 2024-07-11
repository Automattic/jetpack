/**
 * Get the caret position in an active contenteditable element
 * From https://gist.github.com/loilo/f873a88631e660c59a1d5ab757ca9b1e
 *
 * @param {HTMLElement} target - Contenteditable element of which to get the caret position
 * @returns {number} The caret position
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
