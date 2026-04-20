import { store, getContext } from '@wordpress/interactivity';
import './style.scss';

const NAMESPACE = 'jetpack-search';

store( NAMESPACE, {
	state: {
		/**
		 * Truthy when any filter has selected values.
		 *
		 * @return {boolean} Whether any filter is active.
		 */
		get hasActiveFilters() {
			const { state } = store( NAMESPACE );
			return Object.values( state.activeFilters ?? {} ).some( v => v?.length > 0 );
		},

		/**
		 * Flatten activeFilters into a list of pill descriptors for data-wp-each.
		 *
		 * @return {Array<object>} Pills with id, filterKey, value, label.
		 */
		get activePills() {
			const { state } = store( NAMESPACE );
			const pills = [];
			for ( const [ filterKey, values ] of Object.entries( state.activeFilters ?? {} ) ) {
				( values ?? [] ).forEach( value => {
					pills.push( {
						id: `${ filterKey }:${ value }`,
						filterKey,
						value,
						label: `${ filterKey }: ${ value } \u2715`,
					} );
				} );
			}
			return pills;
		},
	},

	actions: {
		/**
		 * Remove the pill currently in scope by toggling the filter off.
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
