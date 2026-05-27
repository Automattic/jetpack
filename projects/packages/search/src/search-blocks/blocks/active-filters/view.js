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
		 * Reads `state.activePills` so the watch tracks it as a dep. The
		 * dedupe runs both eagerly (on every state change) and via a
		 * MutationObserver attached on first run: the duplicate `<li>` can
		 * be added by the Interactivity runtime AFTER the watch callback's
		 * synchronous tick (and after a single rAF) — the observer catches
		 * those late insertions without polling.
		 */
		reconcilePills() {
			const { ref } = getElement();
			const ul = ref?.querySelector( 'ul.jetpack-search-active-filters__pills' );
			if ( ! ul ) {
				return;
			}
			const { state } = store( NAMESPACE );
			// Touch the array so the watch picks it up as a dep.
			void state.activePills;
			// Attach a one-time childList observer that re-runs dedupe on
			// every late `<li>` insertion. Stored on the element so it's
			// idempotent across watch firings.
			if ( ! ul.__jetpackPillObserver && typeof MutationObserver !== 'undefined' ) {
				const observer = new MutationObserver( () => {
					dedupePillsInUl( ul, store( NAMESPACE ).state.activePills );
				} );
				observer.observe( ul, { childList: true } );
				ul.__jetpackPillObserver = observer;
			}
			dedupePillsInUl( ul, state.activePills );
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
