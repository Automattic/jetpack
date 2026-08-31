import { getBlockModalTextarea, getSectionTextarea } from './drafts';

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
 * Accept a section suggestion: write text to the section's textarea and clear
 * the suggestion. The input event fired by setTextareaValue() makes
 * Gutenberg's React onChange run, so the page's own draft state picks up the
 * text (the user still saves via the section's Save button).
 *
 * @param {string}   slug            - Section slug.
 * @param {string}   suggestion      - Suggestion text to write.
 * @param {Function} clearSuggestion - Store action to clear the suggestion.
 */
export function acceptSectionSuggestion( slug, suggestion, clearSuggestion ) {
	const textarea = getSectionTextarea( slug );
	if ( ! textarea ) {
		// Nothing was written (e.g. Gutenberg is mid-re-render), so keep the
		// suggestion in the store — clearing it here would silently discard
		// text the user explicitly accepted.
		return;
	}
	setTextareaValue( textarea, suggestion );
	clearSuggestion( slug );
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
	const textarea = getBlockModalTextarea( blockModal );
	if ( textarea ) {
		setTextareaValue( textarea, suggestion );
	}
	clearSuggestion( blockName );
}
