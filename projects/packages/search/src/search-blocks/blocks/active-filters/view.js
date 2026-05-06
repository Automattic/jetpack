import { __, sprintf } from '@wordpress/i18n';
import { store, getContext } from '@wordpress/interactivity';
import { formatDateBucketLabel } from '../../store/api';
import '../../store';
import { bucketLabel, bucketValue } from '../../store/bucket-key';
import { bootstrapI18n } from '../../store/i18n-bootstrap';
import './style.scss';

// Fetch translations for *this* bundle. The store module bootstraps for
// its own filename, so result-utils strings load via that path; this one
// covers the `__('Remove %s', ...)` call below, which lives in the
// active-filters bundle's .json file rather than the store's.
bootstrapI18n( 'active-filters.js' );

const NAMESPACE = 'jetpack-search';

/**
 * Resolve the display label for a selected filter value. Falls back to the
 * raw slug so a pill stays readable when its bucket falls out of the top-N.
 *
 * @param {object} state       - Store state.
 * @param {string} filterKey   - Filter key.
 * @param {string} filterValue - Selected slug.
 * @return {string} Display label.
 */
function resolveValueLabel( state, filterKey, filterValue ) {
	const config = state.filterConfigs?.[ filterKey ] ?? {};
	if ( config.filterType === 'date' ) {
		const interval = config.interval === 'month' ? 'month' : 'year';
		return formatDateBucketLabel( filterValue, interval, state.locale || 'en-US' );
	}
	const fromConfig = config.valueLabels?.[ filterValue ];
	if ( fromConfig ) {
		return fromConfig;
	}
	const buckets = state.aggregations?.[ filterKey ]?.buckets;
	if ( Array.isArray( buckets ) ) {
		for ( const bucket of buckets ) {
			if ( bucketValue( bucket.key ) === filterValue ) {
				// `valueLabels` already missed above; only the post-slash
				// split is meaningful at this branch.
				return bucketLabel( bucket.key );
			}
		}
	}
	return filterValue;
}

store( NAMESPACE, {
	state: {
		/**
		 * Pill descriptors for `data-wp-each`. `ariaLabel` is composed via
		 * `@wordpress/i18n` so it picks up the page's translations through
		 * the i18n shim — see `Search_Blocks::register_i18n_module()`.
		 *
		 * @return {Array<object>} Pill descriptors.
		 */
		get activePills() {
			const { state } = store( NAMESPACE );
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
						/* translators: %s: filter label (e.g. "Category: News"). Announced by screen readers when focus lands on a filter pill's remove button. */
						ariaLabel: sprintf( __( 'Remove %s', 'jetpack-search-pkg' ), label ),
					} );
				}
			}
			return pills;
		},
	},

	actions: {
		/**
		 * Remove the pill currently in `data-wp-each` scope.
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
