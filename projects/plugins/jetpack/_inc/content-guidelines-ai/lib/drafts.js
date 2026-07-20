import { VALID_SECTIONS } from '../constants';

// Gutenberg 23.6 removed the `core/guidelines` store (the Guidelines
// singleton was dissolved into per-scope wp_knowledge rows, #79263), so the
// page's live draft text now exists only in React component state. The DOM
// textareas are the one place that state is observable from this bundle:
// reads snapshot them, and reactivity comes from a document-level `input`
// listener plus a MutationObserver that re-checks the watched values on DOM
// churn — Gutenberg writes some values through React with no input event
// (e.g. Clear guidelines resetting the form), but those updates always come
// with sibling DOM activity (confirm dialog closing, snackbar, button state).

/**
 * The textarea holding a section's draft, or null while the section
 * isn't rendered.
 *
 * @param {string} slug - Section slug (see VALID_SECTIONS).
 * @return {HTMLTextAreaElement|null} The section's textarea.
 */
export function getSectionTextarea( slug ) {
	return document.querySelector( `.guidelines__list-item[data-slug="${ slug }"] form textarea` );
}

/**
 * The block guideline modal's textarea, or null when absent.
 *
 * @param {HTMLElement|null} blockModal - The block guideline modal element.
 * @return {HTMLTextAreaElement|null} The modal's textarea.
 */
export function getBlockModalTextarea( blockModal ) {
	return blockModal?.querySelector( '.components-textarea-control__input' ) ?? null;
}

/**
 * The current draft text of a section, '' when absent.
 *
 * @param {string} slug - Section slug.
 * @return {string} The draft text.
 */
export function readSectionDraft( slug ) {
	return getSectionTextarea( slug )?.value || '';
}

/**
 * Current draft text for every valid section, keyed by slug.
 *
 * @return {Object} Slug-keyed draft map.
 */
export function readAllSectionDrafts() {
	return Object.fromEntries( VALID_SECTIONS.map( slug => [ slug, readSectionDraft( slug ) ] ) );
}

/**
 * Whether every section's draft is empty.
 *
 * @return {boolean} True when no section has text.
 */
export function areAllSectionDraftsEmpty() {
	return VALID_SECTIONS.every( slug => ! readSectionDraft( slug ) );
}

const listeners = new Set();

/**
 * Subscribe to draft-change notifications.
 *
 * @param {Function} callback - Invoked on every potential draft change.
 * @return {Function} Unsubscribe.
 */
export function subscribeToDrafts( callback ) {
	listeners.add( callback );
	return () => listeners.delete( callback );
}

/**
 * Notify subscribers that drafts may have changed. Subscribers re-read the
 * DOM, so spurious notifications are cheap no-ops.
 */
export function notifyDraftChange() {
	listeners.forEach( listener => listener() );
}

// Composite of every watched value; lets the MutationObserver skip
// notifications for DOM churn that didn't touch any draft.
function watchedValues() {
	return [
		...VALID_SECTIONS.map( readSectionDraft ),
		getBlockModalTextarea( document.querySelector( '.block-guideline-modal' ) )?.value || '',
	].join( '\u0000' );
}

let lastWatched = null;

let tracking = false;

/**
 * Start observing draft edits. Typing and our own setTextareaValue() both
 * dispatch bubbling `input` events (captured so a stopPropagation in the
 * page can't hide them). Value changes Gutenberg makes without input events
 * are caught by re-checking the watched values whenever the DOM mutates,
 * notifying only when one actually changed.
 */
export function startDraftTracking() {
	if ( tracking ) {
		return;
	}
	tracking = true;

	document.addEventListener(
		'input',
		() => {
			lastWatched = watchedValues();
			notifyDraftChange();
		},
		true
	);

	const observer = new MutationObserver( () => {
		const current = watchedValues();
		if ( current !== lastWatched ) {
			lastWatched = current;
			notifyDraftChange();
		}
	} );
	observer.observe( document.body, { childList: true, subtree: true, attributes: true } );
	lastWatched = watchedValues();
}
