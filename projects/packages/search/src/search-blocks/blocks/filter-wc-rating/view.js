import { store, getContext } from '@wordpress/interactivity';
import '../../store';
import { bucketsToStarCountMap } from './bucket-projection';
import './style.scss';

const NAMESPACE = 'jetpack-search';

store( NAMESPACE, {
	state: {
		/**
		 * `data-wp-bind--checked` per-star option. Reads the star value
		 * from the row's `data-wp-context` (set by render.php on each
		 * `<li>`), so one getter serves all five rows without DOM
		 * queries or relying on an unstable `attributes` shape.
		 *
		 * @return {boolean} Whether this star value is in activeFilters.
		 */
		get isRatingOptionSelected() {
			const { filterKey, starValue } = getContext();
			if ( ! starValue || ! filterKey ) {
				return false;
			}
			const { state } = store( NAMESPACE );
			const selected = state.activeFilters?.[ filterKey ];
			return Array.isArray( selected ) && selected.includes( starValue );
		},

		/**
		 * `data-wp-text` per-row count badge. Reads the star value from
		 * the row's `data-wp-context` (set by render.php on each `<li>`)
		 * and looks up the cumulative threshold count for that star.
		 *
		 * @return {string} Count as a string for the badge text node.
		 */
		get ratingOptionCount() {
			const { filterKey, starValue } = getContext();
			if ( ! starValue || ! filterKey ) {
				return '0';
			}
			const { state } = store( NAMESPACE );
			const buckets = state.aggregations?.[ filterKey ]?.buckets;
			const counts = bucketsToStarCountMap( buckets );
			return String( counts[ starValue ] ?? 0 );
		},
	},

	actions: {
		/**
		 * Single-select rating change handler. Picking a star *replaces*
		 * the existing selection (rather than toggling into an array as
		 * the shared `setFilter` does) — the threshold rows nest
		 * (`4★+ ⊂ 3★+ ⊂ 2★+`), so a multi-select would only ever collapse
		 * to the lowest-picked threshold. Re-clicking the active row
		 * clears the selection — Amazon/Etsy convention, and the only
		 * way to clear without leaving the block.
		 *
		 * Inlined here rather than going through `actions.setFilter` so
		 * the shared toggle-into-array semantics other filter blocks rely
		 * on stay untouched.
		 *
		 * @param {Event} event - Change event.
		 * @yield {Promise} search action.
		 */
		*onRatingFilterChange( event ) {
			const { state, actions } = store( NAMESPACE );
			const { filterKey } = getContext();
			if ( ! filterKey ) {
				return;
			}
			const value = String( event.target.value );
			const current = state.activeFilters?.[ filterKey ] ?? [];
			const isOnlyActive = current.length === 1 && current[ 0 ] === value;
			if ( isOnlyActive ) {
				const { [ filterKey ]: _removed, ...rest } = state.activeFilters;
				state.activeFilters = rest;
			} else {
				state.activeFilters = { ...state.activeFilters, [ filterKey ]: [ value ] };
			}
			yield actions.search();
		},
	},
} );
