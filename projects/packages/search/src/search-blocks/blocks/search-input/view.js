import { store, getContext, getElement } from '@wordpress/interactivity';
import 'jetpack-search/store';
import {
	clearSuggestionsContext,
	handleInputForSuggestions,
	handleKeydownForSuggestions,
} from './suggestions';
import './style.scss';

const NAMESPACE = 'jetpack-search';
const SEARCH_DEBOUNCE_MS = 300;

// Per-input debounce keyed on the element so two inputs (header + sidebar)
// don't reset each other; WeakMap lets GC reclaim when the input goes away.
const debounceTimers = new WeakMap();

/**
 * Focus an input and place the cursor at the end of its current value, so
 * a visitor opening Search with a query already in flight can keep typing
 * to refine it without manually re-positioning the caret.
 *
 * @param {HTMLInputElement|null} input - The input to focus.
 */
function focusInputWithCursorAtEnd( input ) {
	if ( ! input ) {
		return;
	}
	input.focus();
	const len = input.value?.length ?? 0;
	// `setSelectionRange` throws on input types that don't support text
	// selection. `type="search"` does, but the guard keeps things safe
	// if the input shape ever changes.
	try {
		input.setSelectionRange( len, len );
	} catch {
		/* noop */
	}
}

/**
 * Start/restart the debounced search. `staticPostTypes` is captured
 * synchronously by the caller — `getContext()` isn't available once the
 * debounce fires outside the element context.
 *
 * @param {HTMLInputElement}                            input           - The input.
 * @param {{include: string[], exclude: string[]}|null} staticPostTypes - Input scope, or null.
 */
function scheduleSearch( input, staticPostTypes ) {
	clearTimeout( debounceTimers.get( input ) );
	const timer = setTimeout( () => {
		debounceTimers.delete( input );
		store( NAMESPACE ).actions.search( { staticPostTypes } );
	}, SEARCH_DEBOUNCE_MS );
	debounceTimers.set( input, timer );
}

/**
 * Per-input scope from `data-wp-context`. Null clears any prior scope and
 * falls back to the page-global seed.
 *
 * @return {{include: string[], exclude: string[]}|null} Scope or null.
 */
function readPostTypeScope() {
	return getContext()?.staticPostTypes ?? null;
}

/**
 * Cancel any pending debounce — used when Enter should fire immediately.
 *
 * @param {HTMLInputElement} input - The input.
 */
function cancelPendingSearch( input ) {
	clearTimeout( debounceTimers.get( input ) );
	debounceTimers.delete( input );
}

store( NAMESPACE, {
	actions: {
		onSearchInput( event ) {
			const { state } = store( NAMESPACE );
			state.searchQuery = event.target.value;
			// Capture scope synchronously (debounce fires outside element context).
			const staticPostTypes = readPostTypeScope();
			// `submitOnly` keeps state in sync but defers the API call until Enter.
			if ( event.target.dataset.submitOnly === 'true' ) {
				cancelPendingSearch( event.target );
			} else {
				scheduleSearch( event.target, staticPostTypes );
			}
			// Short-circuits on non-suggestions inputs.
			handleInputForSuggestions( event.target );
		},

		onSearchKeydown( event ) {
			// Suggestions claim Arrow/Escape, and Enter only when a row is highlighted.
			if ( handleKeydownForSuggestions( event, event.target ) ) {
				return;
			}
			if ( event.key === 'Enter' ) {
				cancelPendingSearch( event.target );
				store( NAMESPACE ).actions.search( { staticPostTypes: readPostTypeScope() } );
			}
		},

		/**
		 * Clear the current search query and re-run search.
		 *
		 * @yield {Promise} search action.
		 */
		*clearSearch() {
			const { state, actions } = store( NAMESPACE );
			state.searchQuery = '';
			clearSuggestionsContext();
			// Read scope before yield — `getContext()` needs the element context.
			const staticPostTypes = readPostTypeScope();
			yield actions.search( { staticPostTypes } );
		},
	},
	callbacks: {
		/**
		 * `data-wp-init` lifecycle hook on the search input. On mount,
		 * place focus into the input with the cursor at the end of any
		 * pre-existing query so a visitor landing on a search page (or
		 * reopening the overlay) can keep typing without re-positioning
		 * the caret.
		 *
		 * Skips when the input sits inside a `[hidden]` subtree — the
		 * overlay-template's clone fires this during hydration while the
		 * overlay shell still has the `hidden` attribute; `openOverlay()`
		 * stays authoritative for the overlay's focus moment.
		 *
		 * Skips when no query has been entered — auto-focusing an empty
		 * search page would steal focus from screen-reader / keyboard
		 * users who'd prefer to land on the page heading first.
		 */
		initFocusInputIfHasQuery() {
			const input = getElement()?.ref;
			if ( ! input || input.closest( '[hidden]' ) !== null ) {
				return;
			}
			const { state } = store( NAMESPACE );
			if ( ! state.searchQuery ) {
				return;
			}
			focusInputWithCursorAtEnd( input );
		},
	},
} );
