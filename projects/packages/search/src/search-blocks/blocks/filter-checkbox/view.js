import { store, getContext } from '@wordpress/interactivity';
import '../../store';
import './style.scss';

const NAMESPACE = 'jetpack-search';

/**
 * Parse an aggregation bucket key into { value, label }.
 *
 * Taxonomy, author, and product-attribute aggregations use `slug_slash_name`
 * fields, so each bucket key carries both pieces (e.g. `news/News`). Post-type
 * buckets use a plain field — no slash, value and label are the same slug.
 * Splitting on the *first* `/` handles names that themselves contain slashes.
 *
 * @param {unknown} rawKey - Bucket `key` from the search response.
 * @return {{ value: string, label: string }} Parsed value (slug) and label (display name).
 */
function parseBucketKey( rawKey ) {
	const key = String( rawKey ?? '' );
	const slashIdx = key.indexOf( '/' );
	if ( slashIdx === -1 ) {
		return { value: key, label: key };
	}
	return { value: key.slice( 0, slashIdx ), label: key.slice( slashIdx + 1 ) };
}

store( NAMESPACE, {
	state: {
		/**
		 * Whether this block's aggregation has any buckets to render. Bound
		 * to the block wrapper's `hidden` attribute so a filter group with
		 * no matches disappears rather than showing an empty list.
		 *
		 * @return {boolean} True when the aggregation has at least one bucket.
		 */
		get hasFilterBuckets() {
			const { state } = store( NAMESPACE );
			const { filterKey } = getContext();
			const buckets = state.aggregations?.[ filterKey ]?.buckets;
			return Array.isArray( buckets ) && buckets.length > 0;
		},

		/**
		 * True when every available bucket is already in activeFilters — the
		 * checkbox list would render empty and the block should show the
		 * "All filters applied" message instead. Also covers the case where
		 * selected includes slugs that no longer appear in the aggregation
		 * (stale URL params), since filterItems would still be empty.
		 *
		 * @return {boolean} True when the list has nothing left to offer.
		 */
		get allBucketsSelected() {
			const { state } = store( NAMESPACE );
			const { filterKey } = getContext();
			const buckets = state.aggregations?.[ filterKey ]?.buckets;
			if ( ! Array.isArray( buckets ) || buckets.length === 0 ) {
				return false;
			}
			const selected = state.activeFilters?.[ filterKey ] ?? [];
			if ( selected.length === 0 ) {
				return false;
			}
			return buckets.every( bucket => {
				const { value } = parseBucketKey( bucket.key );
				return selected.includes( value );
			} );
		},

		/**
		 * Derived list of `{ value, label, showCount, countLabel }` items for
		 * the block's filterKey. Selected buckets are omitted — active
		 * filters appear in the active-filters block instead, so the
		 * checkbox list only offers values the user hasn't chosen yet.
		 *
		 * @return {Array<object>} Item descriptors for each unselected bucket.
		 */
		get filterItems() {
			const { state } = store( NAMESPACE );
			const { filterKey } = getContext();
			const buckets = state.aggregations?.[ filterKey ]?.buckets;
			if ( ! Array.isArray( buckets ) ) {
				return [];
			}
			const selected = state.activeFilters?.[ filterKey ] ?? [];
			const showCount = state.filterConfigs?.[ filterKey ]?.showCount !== false;
			return buckets.reduce( ( items, bucket ) => {
				const { value, label } = parseBucketKey( bucket.key );
				if ( selected.includes( value ) ) {
					return items;
				}
				items.push( {
					value,
					label,
					showCount,
					countLabel: String( bucket.doc_count ?? 0 ),
				} );
				return items;
			}, [] );
		},
	},

	actions: {
		/**
		 * Toggle the filter value that owns the change event. The input's
		 * `value` carries the slug; filterKey comes from the wrapper context.
		 *
		 * @param {Event} event - Change event.
		 * @yield {Promise} setFilter action.
		 */
		*onFilterChange( event ) {
			const { actions } = store( NAMESPACE );
			const { filterKey } = getContext();
			yield actions.setFilter( filterKey, event.target.value );
		},
	},
} );
