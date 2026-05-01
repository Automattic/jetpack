import { store, getContext } from '@wordpress/interactivity';
import '../../store';
import './style.scss';

const NAMESPACE = 'jetpack-search';

/**
 * Look up the display label for a selected filter value.
 *
 * Active filters store the *slug* part of each selection; the matching
 * aggregation bucket key is either the slug itself (post types) or
 * `slug/Name` (taxonomies, authors). If we can find a bucket we use its
 * display name, otherwise we fall back to the raw slug — bucket counts can
 * shift with every new query, and we don't want a selected pill to disappear
 * just because its value fell out of the top-N agg buckets.
 *
 * @param {object} state       - Store state.
 * @param {string} filterKey   - Filter key this value belongs to.
 * @param {string} filterValue - Selected slug.
 * @return {string} Display label.
 */
function resolveValueLabel( state, filterKey, filterValue ) {
	const buckets = state.aggregations?.[ filterKey ]?.buckets;
	if ( Array.isArray( buckets ) ) {
		for ( const bucket of buckets ) {
			const key = String( bucket.key ?? '' );
			const slashIdx = key.indexOf( '/' );
			const slug = slashIdx === -1 ? key : key.slice( 0, slashIdx );
			if ( slug === filterValue ) {
				return slashIdx === -1 ? key : key.slice( slashIdx + 1 );
			}
		}
	}
	return filterValue;
}

store( NAMESPACE, {
	state: {
		/**
		 * Flatten activeFilters into a list of pill descriptors for
		 * `data-wp-each`. Pills carry their own filterKey + value so the
		 * remove handler can toggle the correct selection without looking
		 * it up from the event target.
		 *
		 * `ariaLabel` is what screen readers announce — the visible "×" is
		 * aria-hidden, and the visible label alone ("Category: news") reads
		 * as a plain noun phrase with no hint that activating the button
		 * removes the filter. The "Remove %s" format is seeded in PHP via
		 * `Search_Blocks::build_initial_strings()` because the view bundle
		 * can't import `@wordpress/i18n`.
		 *
		 * @return {Array<object>} Array of pill descriptors with id, filterKey, value, label, ariaLabel.
		 */
		get activePills() {
			const { state } = store( NAMESPACE );
			const removeFormat = state.strings?.removeFilter ?? 'Remove %s';
			const pills = [];
			for ( const [ filterKey, values ] of Object.entries( state.activeFilters ?? {} ) ) {
				if ( ! Array.isArray( values ) ) {
					continue;
				}
				const groupLabel = state.filterConfigs?.[ filterKey ]?.label ?? filterKey;
				for ( const value of values ) {
					const valueLabel = resolveValueLabel( state, filterKey, value );
					const label = `${ groupLabel }: ${ valueLabel }`;
					pills.push( {
						id: `${ filterKey }:${ value }`,
						filterKey,
						value,
						label,
						ariaLabel: removeFormat.replace( '%s', label ),
					} );
				}
			}
			return pills;
		},
	},

	actions: {
		/**
		 * Remove the pill currently in `data-wp-each` scope by toggling its
		 * filter value off.
		 *
		 * @yield {Promise} setFilter action.
		 */
		*onRemovePill() {
			const { actions } = store( NAMESPACE );
			const { pill } = getContext();
			yield actions.setFilter( pill.filterKey, pill.value );
		},
	},
} );
