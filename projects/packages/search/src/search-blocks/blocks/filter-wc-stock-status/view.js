import { store, getContext, getElement } from '@wordpress/interactivity';
import 'jetpack-search/store';
import './style.scss';

const NAMESPACE = 'jetpack-search';

/**
 * `outofstock` bucket count from a terms agg. The agg is built with
 * `include: ['outofstock']` so at most one bucket can come back.
 *
 * @param {Array<{key: string, doc_count: number}>} buckets - Aggregation buckets.
 * @return {number} Out-of-stock count, or 0.
 */
function readOutOfStockCount( buckets ) {
	if ( ! Array.isArray( buckets ) ) {
		return 0;
	}
	for ( const bucket of buckets ) {
		if ( String( bucket?.key ?? '' ) === 'outofstock' ) {
			return Number( bucket?.doc_count ?? 0 );
		}
	}
	return 0;
}

store( NAMESPACE, {
	state: {
		/**
		 * `data-wp-bind--checked` for the in-stock toggle. Reads `value` off
		 * the element so the getter stays generic if the option list grows.
		 *
		 * @return {boolean} Whether this option is selected.
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
		 * Count badge for in-stock. The agg only carries `outofstock` (no
		 * positive `instock` term), so in-stock = `totalResults − outOfStock`.
		 * Single-option scope; if `get_options()` grows back to multi-entry,
		 * dispatch on input value like `isStatusOptionSelected` does.
		 *
		 * @return {string} Count as a string.
		 */
		get statusOptionCount() {
			const { state } = store( NAMESPACE );
			const { filterKey } = getContext();
			const outOfStock = readOutOfStockCount( state.aggregations?.[ filterKey ]?.buckets );
			const total = Number( state.totalResults ?? 0 );
			return String( Math.max( 0, total - outOfStock ) );
		},
	},

	actions: {
		/**
		 * Toggle the stock-status value from the change event.
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
