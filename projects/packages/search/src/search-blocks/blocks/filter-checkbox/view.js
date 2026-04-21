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
		 * Derived list of `{ value, label, isChecked, showCount, countLabel }`
		 * items for the block's filterKey. Bound to `data-wp-each` so the
		 * template iterates once and updates on every new aggregation.
		 *
		 * @return {Array<object>} Item descriptors for each bucket.
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
			return buckets.map( bucket => {
				const { value, label } = parseBucketKey( bucket.key );
				return {
					value,
					label,
					isChecked: selected.includes( value ),
					showCount,
					countLabel: String( bucket.doc_count ?? 0 ),
				};
			} );
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
