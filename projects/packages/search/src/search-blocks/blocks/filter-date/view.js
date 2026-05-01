import { store, getContext } from '@wordpress/interactivity';
import { formatDateBucketLabel } from '../../store/api';
import '../../store';
import './style.scss';

const NAMESPACE = 'jetpack-search';

/**
 * Resolve the slug for a date_histogram bucket.
 *
 * Date buckets carry both `key` (epoch milliseconds, used to feed the JS
 * label formatter) and `key_as_string` (formatted by ES with the same `Y`
 * or `Y-m` format the block requested). We use `key_as_string` as the slug
 * so URLs read like `?post_date[]=2024` or `?post_date[]=2024-03`, which is
 * what visitors expect to see and what the PHP `range` clause builder
 * (Filter_Date::format_bucket_label) keys against.
 *
 * @param {object} bucket - Aggregation bucket from the search response.
 * @return {string} Bucket slug (year or yyyy-mm).
 */
function bucketSlug( bucket ) {
	const ks = bucket?.key_as_string;
	if ( typeof ks === 'string' && ks !== '' ) {
		return ks;
	}
	// `key_as_string` is always populated when ES has a `format` on the agg
	// (which buildAggregations supplies), but fall back to the numeric key
	// stringified so a malformed response still produces a stable identifier.
	return String( bucket?.key ?? '' );
}

store( NAMESPACE, {
	state: {
		/**
		 * Whether this block's date_histogram has any populated buckets to
		 * render. Bound to the wrapper's `hidden` attribute so a query with
		 * no results doesn't leave an empty filter heading in the sidebar.
		 *
		 * @return {boolean} True when the aggregation has at least one bucket
		 * with a non-zero doc_count.
		 */
		get hasFilterBuckets() {
			const { state } = store( NAMESPACE );
			const { filterKey } = getContext();
			const buckets = state.aggregations?.[ filterKey ]?.buckets;
			if ( ! Array.isArray( buckets ) || buckets.length === 0 ) {
				return false;
			}
			// date_histogram emits empty buckets for every interval inside the
			// range with `min_doc_count: 0` (the ES default); we don't pass
			// min_doc_count, but keep this guard so a response shape change
			// can't quietly resurface zero-count buckets.
			return buckets.some( bucket => ( bucket?.doc_count ?? 0 ) > 0 );
		},

		/**
		 * True when every populated bucket is already in activeFilters — the
		 * checkbox list would render empty and the block should show the
		 * "All filters applied" message instead. Bucket slug comes from
		 * `key_as_string` (e.g. `2024-03`), not from a slash-split key as in
		 * filter-checkbox.
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
			const populated = buckets.filter( bucket => ( bucket?.doc_count ?? 0 ) > 0 );
			if ( populated.length === 0 ) {
				return false;
			}
			const selected = state.activeFilters?.[ filterKey ] ?? [];
			if ( selected.length === 0 ) {
				return false;
			}
			return populated.every( bucket => selected.includes( bucketSlug( bucket ) ) );
		},

		/**
		 * Derived list of `{ value, label, showCount, countLabel }` items for
		 * the block's filterKey. Selected buckets are dropped — active
		 * filters appear in the active-filters block instead, so the
		 * checkbox list only offers values the user hasn't chosen yet.
		 *
		 * Each item carries a pre-formatted `label` so the active-filters
		 * pill task can read this same shape without re-implementing date
		 * formatting per block. The label is computed via
		 * `formatDateBucketLabel`, which mirrors the PHP `wp_date()` path
		 * server-side.
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
			const config = state.filterConfigs?.[ filterKey ] ?? {};
			const selected = state.activeFilters?.[ filterKey ] ?? [];
			const showCount = config.showCount !== false;
			const interval = config.interval === 'month' ? 'month' : 'year';
			const locale = state.locale || 'en-US';
			// date_histogram has no ES `size` parameter — the response carries
			// every non-empty bucket in the date range. Slice client-side to
			// `maxItems` so a long-running blog doesn't render dozens of
			// checkboxes; ES order has already placed the user's preferred
			// buckets (`newest` by default) at the head of the list.
			const limit = Math.max( 1, config.maxItems ?? 10 );
			const items = [];
			for ( const bucket of buckets ) {
				if ( items.length >= limit ) {
					break;
				}
				if ( ( bucket?.doc_count ?? 0 ) <= 0 ) {
					continue;
				}
				const value = bucketSlug( bucket );
				if ( ! value || selected.includes( value ) ) {
					continue;
				}
				items.push( {
					value,
					label: formatDateBucketLabel( value, interval, locale ),
					showCount,
					countLabel: String( bucket.doc_count ),
				} );
			}
			return items;
		},
	},

	actions: {
		/**
		 * Toggle the date bucket that owns the change event. The input's
		 * `value` carries the slug (year or yyyy-mm); filterKey comes from
		 * the wrapper context. Reuses the shared `setFilter` action so the
		 * activeFilters bookkeeping stays identical to filter-checkbox.
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
