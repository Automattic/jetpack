import { store, getContext } from '@wordpress/interactivity';
import 'jetpack-search/store';
import {
	clearSuggestionsContext,
	handleInputForSuggestions,
	handleKeydownForSuggestions,
} from './suggestions';
import './style.scss';

const NAMESPACE = 'jetpack-search';
const SEARCH_DEBOUNCE_MS = 300;

// Per-input debounce state. Keyed by the input element itself so two
// search-input blocks on the same page (e.g. header + sidebar) don't
// reset each other's typing timer. WeakMap lets GC reclaim entries
// when an input is removed from the DOM.
const debounceTimers = new WeakMap();

/**
 * Start (or restart) the debounced search for a single input.
 *
 * `staticPostTypes` is captured synchronously by the caller (the debounce fires
 * outside the Interactivity element context, where `getContext()` is no longer
 * available) and handed to `actions.search()` so this input's post-type scope
 * overrides the page-global one for the search it initiates.
 *
 * @param {HTMLInputElement}                            input           - The input whose timer should be reset.
 * @param {{include: string[], exclude: string[]}|null} staticPostTypes - This input's scope, or null.
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
 * Read the post-type scope seeded into this input's `data-wp-context`. Returns
 * null when the input has no scope so `actions.search()` clears any scope a
 * previously-used input left active and falls back to the page-global seed.
 *
 * @return {{include: string[], exclude: string[]}|null} The scope, or null.
 */
function readPostTypeScope() {
	return getContext()?.staticPostTypes ?? null;
}

/**
 * Cancel any in-flight search debounce for a single input — used when a
 * keystroke should fire a search immediately (e.g. Enter).
 *
 * @param {HTMLInputElement} input - The input whose timer should be cleared.
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
			// Captured here (synchronously, inside the element context) so the
			// debounced fire can apply this input's post-type scope.
			const staticPostTypes = readPostTypeScope();
			// `submitOnly` inputs still keep `state.searchQuery` in sync so
			// bindings render the typed value, but defer the actual API call
			// until Enter / the clear button — useful for sites that want
			// fewer requests than the default live-search debounce produces.
			if ( event.target.dataset.submitOnly === 'true' ) {
				cancelPendingSearch( event.target );
			} else {
				scheduleSearch( event.target, staticPostTypes );
			}
			// Delegated to ./suggestions.js — short-circuits on non-suggestions
			// inputs, so this stays a single unconditional call.
			handleInputForSuggestions( event.target );
		},

		onSearchKeydown( event ) {
			// The suggestions layer claims ArrowUp / ArrowDown / Escape
			// outright, and `Enter` only when a row is highlighted. Any
			// other keystroke — including an unclaimed Enter — falls
			// through to the default search dispatch below.
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
			// Read the scope before the first yield — `getContext()` needs the
			// synchronous element context the clear button runs in.
			const staticPostTypes = readPostTypeScope();
			yield actions.search( { staticPostTypes } );
		},
	},
} );
