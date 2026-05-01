import { store } from '@wordpress/interactivity';
import '../../store';
import './style.scss';

const NAMESPACE = 'jetpack-search';
const DEBOUNCE_MS = 300;

// Per-input debounce state. Keyed by the input element itself so two
// search-input blocks on the same page (e.g. header + sidebar) don't
// reset each other's typing timer. WeakMap lets GC reclaim entries
// when an input is removed from the DOM.
const debounceTimers = new WeakMap();

/**
 * Start (or restart) the debounced search for a single input.
 *
 * @param {HTMLInputElement} input - The input whose timer should be reset.
 */
function scheduleSearch( input ) {
	clearTimeout( debounceTimers.get( input ) );
	const timer = setTimeout( () => {
		debounceTimers.delete( input );
		const { actions } = store( NAMESPACE );
		actions.search();
	}, DEBOUNCE_MS );
	debounceTimers.set( input, timer );
}

/**
 * Cancel any in-flight debounce for a single input — used when a keystroke
 * should fire a search immediately (e.g. Enter).
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
			// `submitOnly` inputs still keep `state.searchQuery` in sync so
			// bindings render the typed value, but defer the actual API call
			// until Enter / the clear button — useful for sites that want
			// fewer requests than the default live-search debounce produces.
			if ( event.target.dataset.submitOnly === 'true' ) {
				cancelPendingSearch( event.target );
				return;
			}
			scheduleSearch( event.target );
		},

		onSearchKeydown( event ) {
			if ( event.key === 'Enter' ) {
				cancelPendingSearch( event.target );
				const { actions } = store( NAMESPACE );
				actions.search();
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
			yield actions.search();
		},
	},
} );
