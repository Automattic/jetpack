import { requestAnimationFrame } from './requestAnimationFrame';

export const saveCaretPosition = ( containerEl, caretPositionRef ) => {
	const selection = containerEl.ownerDocument.defaultView.getSelection();

	if ( selection.rangeCount > 0 ) {
		const range = selection.getRangeAt( 0 );
		const preCaretRange = range.cloneRange();
		preCaretRange.selectNodeContents( range.startContainer );
		preCaretRange.setEnd( range.startContainer, range.startOffset );
		const caretOffset = preCaretRange.toString().length;

		caretPositionRef.current = {
			container: range.startContainer,
			offset: caretOffset,
		};
	}
};

export const restoreCaretPosition = ( containerEl, caretPositionRef ) => {
	const { container, offset } = caretPositionRef.current || {};

	if ( container && typeof offset === 'number' ) {
		const range = containerEl.ownerDocument.createRange();
		const selection = containerEl.ownerDocument.defaultView.getSelection();
		range.setStart( container, offset );
		range.collapse( true );
		selection.removeAllRanges();
		selection.addRange( range );
	}
};

export const getChildTextNodes = element => {
	const textNodes = [];

	for ( let i = 0; i < element.childNodes.length; i++ ) {
		const childNode = element.childNodes[ i ];

		if ( childNode.nodeType === Node.TEXT_NODE ) {
			textNodes.push( childNode );
		} else if ( childNode.nodeType === Node.ELEMENT_NODE ) {
			const childNodeTextNodes = getChildTextNodes( childNode );
			textNodes.push( ...childNodeTextNodes );
		}
	}

	return textNodes;
};

export const simulateClick = ( event, blockElement ) => {
	blockElement.focus();

	requestAnimationFrame( () => {
		const selectedText = blockElement.ownerDocument.getSelection();
		const clickRange = blockElement.ownerDocument.createRange();
		const textNodes = getChildTextNodes( blockElement );

		// Get the mouse click position relative to the block
		const clickRect = blockElement.getBoundingClientRect();
		const x = event.clientX - clickRect.left;

		// Translate event.nativeEvent.pageY to local block coordinate
		const y =
			event.nativeEvent.pageY -
			blockElement.ownerDocument.documentElement.scrollTop -
			clickRect.top;

		// Get the text node and determine the character offset based on the click position
		let offset = 0;
		let accumulatedWidth = 0;

		// Create a temporary range to measure text width
		let textNode;

		for ( let i = 0; i < textNodes.length; i++ ) {
			textNode = textNodes[ i ];

			for ( let j = 0; j < textNode.textContent.length; j++ ) {
				clickRange.setStart( textNode, j );
				clickRange.setEnd( textNode, j + 1 );
				const charRect = clickRange.getBoundingClientRect();

				if ( y >= charRect.top - clickRect.top && y <= charRect.bottom - clickRect.top ) {
					accumulatedWidth += charRect.width;
					// If x is between the accumulated width minus half the character width and the full accumulated width, then the click is closer to the next character
					if ( x >= accumulatedWidth - charRect.width / 2 && x <= accumulatedWidth ) {
						offset = j + 1;
						break;
					}
					// if x is less than the accumulated width, then the click is closer to the previous character
					else if ( x < accumulatedWidth ) {
						offset = j;
						break;
					}
				}
			}
		}

		// Set the caret at the exact position where the click occurred
		clickRange.setStart( textNode, offset );
		clickRange.collapse( true );

		selectedText.removeAllRanges();
		selectedText.addRange( clickRange );
	} );
};
