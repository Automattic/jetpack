import { store, getContext, getElement } from '@wordpress/interactivity';
import 'jetpack-search/store';
import { buildActivePills, dedupePillsInUl } from './lib';
import './style.scss';

const NAMESPACE = 'jetpack-search';

store( NAMESPACE, {
	state: {
		/**
		 * Flatten activeFilters + priceRange into a list of pill descriptors
		 * for `data-wp-each`. Pills carry their own `kind` discriminator so
		 * the remove handler can dispatch to the right action without
		 * peeking at filterKey shape.
		 *
		 * Heavy lifting (label resolution, plural handling, price chip
		 * formatting) lives in `./lib.js` so it's directly unit-testable
		 * without an Interactivity API runtime.
		 *
		 * @return {Array<object>} Array of pill descriptors (id, kind, filterKey, value, label, ariaLabel).
		 */
		get activePills() {
			const { state } = store( NAMESPACE );
			return buildActivePills( state );
		},
	},

	callbacks: {
		/**
		 * Reconcile materialized `<li>` pill children against
		 * `state.activePills` on every state change. Defends against an
		 * Interactivity API hydration quirk on some hosts that doubles the
		 * `data-wp-each` materialization (see SEARCH-266 + `dedupePillsInUl`).
		 *
		 * Reads `state.activePills` so the watch tracks it as a dep, then
		 * defers the DOM cleanup to the next animation frame: `data-wp-each`
		 * materializes children as part of the same hydration / state-change
		 * pass, so the duplicate `<li>` doesn't exist yet when the watch
		 * first fires — the rAF lets the materialization land first.
		 */
		reconcilePills() {
			const { state } = store( NAMESPACE );
			const { ref } = getElement();
			const pills = state.activePills;
			const ul = ref?.querySelector( 'ul.jetpack-search-active-filters__pills' );
			if ( ! ul ) {
				return;
			}
			const raf =
				( typeof window !== 'undefined' && window.requestAnimationFrame ) ||
				( fn => setTimeout( fn, 0 ) );
			raf( () => dedupePillsInUl( ul, pills ) );
		},
	},

	actions: {
		/**
		 * Remove the pill currently in `data-wp-each` scope. Dispatches on
		 * the pill's `kind`: a regular filter pill toggles its value off
		 * via setFilter (which removes it since the value is currently on),
		 * a price-range pill clears both bounds.
		 *
		 * @yield {Promise} setFilter or setPriceRange action.
		 */
		*onRemovePill() {
			const { actions } = store( NAMESPACE );
			const { pill } = getContext();
			if ( pill.kind === 'priceRange' ) {
				yield actions.setPriceRange( null, null );
				return;
			}
			yield actions.setFilter( pill.filterKey, pill.value );
		},
	},
} );
