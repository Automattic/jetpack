import { store, getContext } from '@wordpress/interactivity';
import '../../store';
import './style.scss';

const NAMESPACE = 'jetpack-search';

/**
 * Project a histogram bucket array onto a cumulative "& up" star → count
 * map. Each star N's count is the sum of doc_counts for every bucket
 * whose key is ≥ N - 0.5, i.e., every avg_rating that rounds to N or
 * higher. Guarantees the rendered counts are monotone (count(3) ≥
 * count(4) ≥ count(5)) — the property shoppers expect from threshold
 * rows. Buckets below 0.5 (the implicit "no rating" bucket the histogram
 * emits at -0.5 thanks to `min_doc_count: 0`) are ignored. Mirrors the
 * same projection in render.php.
 *
 * @param {Array<{key: number, doc_count: number}>} buckets - Aggregation buckets.
 * @return {Object<string, number>} Star (as string key, "1".."5") → count.
 */
function bucketsToStarCountMap( buckets ) {
	const map = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
	if ( ! Array.isArray( buckets ) ) {
		return map;
	}
	for ( const bucket of buckets ) {
		const key = Number( bucket?.key ?? NaN );
		const count = Number( bucket?.doc_count ?? 0 );
		if ( ! Number.isFinite( key ) || key < 0.5 ) {
			continue;
		}
		// Bucket keys land on .5 boundaries; `key + 0.5` is the highest
		// star whose threshold this bucket clears. A doc in the 4.5
		// bucket counts toward 5★+, 4★+, …, 1★+; a doc in the 0.5
		// bucket only toward 1★+. `Math.round` shrugs off FP slop.
		const cap = Math.min( 5, Math.round( key + 0.5 ) );
		for ( let star = 1; star <= cap; star++ ) {
			map[ star ] += count;
		}
	}
	return map;
}

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
			if ( ! starValue ) {
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
			if ( ! starValue ) {
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
