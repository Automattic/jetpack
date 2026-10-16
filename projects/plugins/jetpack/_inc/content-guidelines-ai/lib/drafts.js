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

// Every watched value, in a fixed order; lets the change checks skip
// notifications for events that didn't touch any draft. Kept as an array and
// compared element-wise — joining would copy up to ~25KB of guideline text
// per check (5000 chars per section, see wp_guideline_max_length()).
function watchedValues() {
	return [
		...VALID_SECTIONS.map( readSectionDraft ),
		getBlockModalTextarea( document.querySelector( '.block-guideline-modal' ) )?.value || '',
	];
}

let lastWatched = [];

// Notify only when a watched value actually changed. Both event sources
// funnel through here, so typing in unrelated fields (the block combobox,
// admin search) and non-draft DOM churn cost one read pass and no fan-out.
function checkAndNotify() {
	const current = watchedValues();
	if (
		current.length === lastWatched.length &&
		current.every( ( value, i ) => value === lastWatched[ i ] )
	) {
		return;
	}
	lastWatched = current;
	notifyDraftChange();
}

let tracking = false;

/**
 * Start observing draft edits. Typing and our own setTextareaValue() both
 * dispatch bubbling `input` events (captured so a stopPropagation in the
 * page can't hide them). Value changes Gutenberg makes without input events
 * are caught by re-checking the watched values on the DOM churn that
 * accompanies them — added/removed nodes, or a change to one of the
 * form-state attributes the observer filters for. Either way, subscribers
 * are notified only when a watched value changed.
 */
export function startDraftTracking() {
	if ( tracking ) {
		return;
	}
	tracking = true;

	document.addEventListener( 'input', checkAndNotify, true );

	// Watch node add/remove across the whole tree — the dialog-close and
	// snackbar churn that accompanies a form reset — but limit attribute
	// watching to the form-state attributes a reset actually toggles (button
	// disabled state, modal/loading class markers). This drops the steady
	// stream of cosmetic attribute mutations a Gutenberg editor produces
	// (style, aria-live, inline data-* bookkeeping) so checkAndNotify's read
	// pass runs far less often, while keeping every signal that flags a silent
	// draft reset.
	const observer = new MutationObserver( checkAndNotify );
	observer.observe( document.body, {
		childList: true,
		subtree: true,
		attributeFilter: [ 'class', 'disabled', 'aria-disabled', 'hidden' ],
	} );
	lastWatched = watchedValues();
}
