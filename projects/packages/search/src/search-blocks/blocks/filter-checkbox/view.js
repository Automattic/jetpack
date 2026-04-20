import { store, getContext } from '@wordpress/interactivity';
import '../../store';
import './style.scss';

const NAMESPACE = 'jetpack-search';

store( NAMESPACE, {
	state: {
		/**
		 * Per-checkbox derived state: is this checkbox's value currently active?
		 * Uses per-element context to get filterKey + itemValue.
		 *
		 * @return {boolean} True when the checkbox value is active.
		 */
		get isChecked() {
			const { state } = store( NAMESPACE );
			const context = getContext();
			const activeValues = state.activeFilters[ context.filterKey ] ?? [];
			return activeValues.includes( context.itemValue );
		},

		/**
		 * Per-checkbox derived state: count from aggregations for this item.
		 *
		 * @return {number|null} Doc count or null when unavailable.
		 */
		get count() {
			const { state } = store( NAMESPACE );
			const context = getContext();
			const agg = state.aggregations[ context.filterKey ];
			if ( ! agg ) {
				return null;
			}

			// Terms aggregation shape: { buckets: [{ key, doc_count }] }.
			if ( Array.isArray( agg.buckets ) ) {
				const bucket = agg.buckets.find( b => b.key === context.itemValue );
				return bucket?.doc_count ?? null;
			}
			// Filters aggregation shape: { buckets: { [value]: { doc_count } } }.
			if ( agg.buckets && agg.buckets[ context.itemValue ] !== undefined ) {
				return agg.buckets[ context.itemValue ].doc_count ?? null;
			}
			return null;
		},
	},

	actions: {
		/**
		 * Handle a checkbox change by toggling the filter and re-running search.
		 *
		 * @param {Event} event - Change event.
		 * @yield {Promise} setFilter action.
		 */
		*onFilterChange( event ) {
			const context = getContext();
			const { actions } = store( NAMESPACE );
			yield actions.setFilter( context.filterKey, event.target.value );
		},
	},
} );
