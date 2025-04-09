export default function setFocus( wrapper, selector, index, cursorToEnd ) {
	setTimeout( () => {
		const input = wrapper.querySelectorAll( selector )[ index ];

		if ( ! input ) {
			return;
		}

		input.focus();

		// Allows moving the cursor to the end of
		// 'contenteditable' elements like <RichText />
		if ( document.createRange && cursorToEnd ) {
			const range = document.createRange();
			range.selectNodeContents( input );
			range.collapse( false );
			const selection = document.defaultView.getSelection();
			selection.removeAllRanges();
			selection.addRange( range );
		}
	}, 0 );
}
