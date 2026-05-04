import { store, getContext } from '@wordpress/interactivity';
import { formatDateBucketLabel } from '../../store/api';
import '../../store';
import { bucketLabel, bucketValue } from '../../store/bucket-key';
import './style.scss';

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
		 * Pill descriptors for `data-wp-each`. `ariaLabel` uses the "Remove %s"
		 * format seeded from PHP because the view bundle cannot import
		 * `@wordpress/i18n`.
		 *
		 * @return {Array<object>} Pill descriptors.
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
