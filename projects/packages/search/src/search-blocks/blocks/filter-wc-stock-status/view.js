import { store, getContext, getElement } from '@wordpress/interactivity';
import '../../store';
import './style.scss';

const NAMESPACE = 'jetpack-search';

/**
 * Read the `outofstock` bucket's count from a terms-aggregation response.
 * The aggregation is built with `include: ['outofstock']` so at most one
 * bucket can come back; the helper returns 0 when the bucket is absent
 * (no out-of-stock products in the current scope, or pre-hydration state
 * with no aggregation yet).
 *
 * @param {Array<{key: string, doc_count: number}>} buckets - Aggregation buckets.
 * @return {number} Out-of-stock count, or 0 when none.
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
		 * `data-wp-bind--checked` for the in-stock toggle. Reads the
		 * input's `value` attribute via `getElement().attributes.value`
		 * so the getter stays generic (the option list comes from
		 * `Search_Product_Filter_Status::get_options()` and may grow
		 * back to multiple entries once the WPCOM-side ES indexer carries
		 * `_stock_status` again). Falls back to false when the filter
		 * has no selections so unchecking re-renders cleanly.
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
		 * `data-wp-text` count badge for the in-stock option. The
		 * aggregation only carries the `outofstock` bucket against
		 * `product_visibility` (the taxonomy has no positive `instock`
		 * term), so in-stock is derived as
		 * `state.totalResults - outOfStock`. Counts reflect the current
		 * filter scope: when the toggle is on, the filter excludes
		 * out-of-stock and the bucket count is `0`, leaving the in-stock
		 * count equal to the (already narrowed) `totalResults`. Falls
		 * back to "0" pre-hydration.
		 *
		 * Single-option scope: this getter assumes the only rendered
		 * checkbox is `instock`. If `Search_Product_Filter_Status::get_options()`
		 * ever grows back to multiple entries (once the WPCOM-side ES
		 * indexer carries `_stock_status`), this getter needs to dispatch
		 * on the input's `value` like `isStatusOptionSelected` does.
		 *
		 * @return {string} Count as a string for the badge text node.
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
