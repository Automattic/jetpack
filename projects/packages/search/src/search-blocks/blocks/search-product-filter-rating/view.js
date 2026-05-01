import { store, getContext, getElement } from '@wordpress/interactivity';
import '../../store';
import './style.scss';

const NAMESPACE = 'jetpack-search';

/**
 * Project a histogram bucket array onto a star → count map.
 *
 * Bucket keys land on half-integer boundaries (0.5, 1.5, 2.5, 3.5, 4.5)
 * thanks to the `interval: 1, offset: 0.5` aggregation. Each maps to one
 * star band per WC's `ROUND(avg_rating, 0)` rule: 4.5 → star 5, 3.5 →
 * star 4, etc. Buckets outside that range (the implicit -0.5 "no rating"
 * bucket from `min_doc_count: 0`) are ignored — there's no UI option
 * for them. Mirrors the same projection in render.php.
 *
 * @param {Array<{key: number, doc_count: number}>} buckets - Aggregation buckets.
 * @return {Object<string, number>} Star (as string key, "1".."5") → count.
 */
function bucketsToStarCountMap( buckets ) {
	if ( ! Array.isArray( buckets ) ) {
		return {};
	}
	const map = {};
	for ( const bucket of buckets ) {
		const key = Number( bucket?.key ?? -1 );
		const count = Number( bucket?.doc_count ?? 0 );
		// .5-boundary key → star integer. Equivalent to Math.round(key + 0.5).
		const star = Math.trunc( key + 1.0 );
		if ( star >= 1 && star <= 5 ) {
			map[ String( star ) ] = count;
		}
	}
	return map;
}

store( NAMESPACE, {
	state: {
		/**
		 * `data-wp-bind--checked` per-star option. Reads the input's
		 * `value` attribute via `getElement().attributes.value` so one
		 * getter serves all five rows without per-row context.
		 *
		 * @return {boolean} Whether this star value is in activeFilters.
		 */
		get isRatingOptionSelected() {
			const value = getElement()?.attributes?.value;
			if ( ! value ) {
				return false;
			}
			const { state } = store( NAMESPACE );
			const { filterKey } = getContext();
			const selected = state.activeFilters?.[ filterKey ];
			return Array.isArray( selected ) && selected.includes( value );
		},

		/**
		 * `data-wp-text` per-row count badge. Locates the matching
		 * checkbox input via the shared `<label>` parent, reads the star
		 * value off its `value` attribute, and returns the projected
		 * histogram count. Falls back to "0" when the row has no
		 * matches in the current scope — convention for "always show all
		 * options" facet UIs.
		 *
		 * @return {string} Count as a string for the badge text node.
		 */
		get ratingOptionCount() {
			const el = getElement()?.ref;
			const label = el?.closest?.( 'label' );
			const input = label?.querySelector?.( 'input[type="checkbox"]' );
			const value = input?.getAttribute?.( 'value' );
			if ( ! value ) {
				return '0';
			}
			const { state } = store( NAMESPACE );
			const { filterKey } = getContext();
			const buckets = state.aggregations?.[ filterKey ]?.buckets;
			const counts = bucketsToStarCountMap( buckets );
			return String( counts[ value ] ?? 0 );
		},
	},

	actions: {
		/**
		 * Toggle the star value that owns the change event. The input's
		 * `value` attribute carries the star (1–5) as a string; filterKey
		 * comes from the wrapper context.
		 *
		 * @param {Event} event - Change event.
		 * @yield {Promise} setFilter action.
		 */
		*onRatingFilterChange( event ) {
			const { actions } = store( NAMESPACE );
			const { filterKey } = getContext();
			yield actions.setFilter( filterKey, event.target.value );
		},
	},
} );
