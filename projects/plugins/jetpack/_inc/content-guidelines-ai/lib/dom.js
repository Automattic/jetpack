/**
 * Programmatically set a React-controlled textarea's value.
 * Uses the native setter so React's synthetic onChange fires.
 *
 * @param {HTMLTextAreaElement} textarea - The textarea element.
 * @param {string}              value    - The new value.
 */
export function setTextareaValue( textarea, value ) {
	const setter = Object.getOwnPropertyDescriptor(
		window.HTMLTextAreaElement.prototype,
		'value'
	).set;
	setter.call( textarea, value );
	textarea.dispatchEvent( new Event( 'input', { bubbles: true } ) );
}

/**
 * Accept a block suggestion: write text to the modal textarea and clear the store.
 *
 * @param {HTMLElement} blockModal      - The block guideline modal element.
 * @param {string}      blockName       - Block name key in the store.
 * @param {string}      suggestion      - Suggestion text to write.
 * @param {Function}    clearSuggestion - Store action to clear the suggestion.
 */
export function acceptBlockSuggestion( blockModal, blockName, suggestion, clearSuggestion ) {
	const textarea = blockModal?.querySelector( '.components-textarea-control__input' );
	if ( textarea ) {
		setTextareaValue( textarea, suggestion );
	}
	clearSuggestion( blockName );
}
