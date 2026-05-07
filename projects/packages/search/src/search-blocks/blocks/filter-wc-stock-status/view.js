import { store, getContext, getElement } from '@wordpress/interactivity';
import '../../store';
import './style.scss';

const NAMESPACE = 'jetpack-search';

/**
 * Build a slug → count map from a histogram-or-terms aggregation's buckets.
 * Returns a plain object so the per-option getter can do a constant-time
 * lookup and avoid re-scanning the bucket array for every render.
 *
 * @param {Array<{key: string, doc_count: number}>} buckets - Aggregation buckets.
 * @return {object} Slug-keyed count map.
 */
function bucketsToCountMap( buckets ) {
	if ( ! Array.isArray( buckets ) ) {
		return {};
	}
	const map = {};
	for ( const bucket of buckets ) {
		const key = String( bucket?.key ?? '' );
		if ( ! key ) {
			continue;
		}
		map[ key ] = Number( bucket?.doc_count ?? 0 );
	}
	return map;
}

store( NAMESPACE, {
	state: {
		/**
		 * `data-wp-bind--checked` per-option. Reads the input's `value`
		 * attribute via `getElement().attributes.value` so the same getter
		 * serves all three options without per-option context. Falls back
		 * to false when the filter has no selections so unchecking the
		 * last box re-renders cleanly.
		 *
		 * @return {boolean} Whether this option's slug is in activeFilters.
		 */
		get isStatusOptionSelected() {
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
		 * `data-wp-text` per-option count badge. Reads the option's slug
		 * from the option's `<input value=…>` (the count badge sits next
		 * to the input inside the same `<label>`), then looks the slug up
		 * in the aggregation. Falls back to "0" when the filter has no
		 * matches in the current scope — convention for "always show all
		 * options" facet UIs.
		 *
		 * @return {string} Count as a string for the badge text node.
		 */
		get statusOptionCount() {
			// The count <span> sits as a sibling of the <input> inside the
			// shared <label>. Walk up to the label, then find the input
			// to read its `value` attribute — the slug we look up below.
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
			const counts = bucketsToCountMap( buckets );
			return String( counts[ value ] ?? 0 );
		},
	},

	actions: {
		/**
		 * Toggle the stock-status value that owns the change event. The
		 * input's `value` attribute carries the slug; filterKey comes from
		 * the wrapper context.
		 *
		 * @param {Event} event - Change event.
		 * @yield {Promise} setFilter action.
		 */
		*onStatusFilterChange( event ) {
			const { actions } = store( NAMESPACE );
			const { filterKey } = getContext();
			yield actions.setFilter( filterKey, event.target.value );
		},
	},
} );
