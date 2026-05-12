import { store, getContext } from '@wordpress/interactivity';
import '../../store';
import { buildActivePills } from './lib';
import './style.scss';

const NAMESPACE = 'jetpack-search';

store( NAMESPACE, {
	state: {
		/**
		 * Flatten activeFilters + priceRange into a list of pill descriptors
		 * for `data-wp-each`. Pills carry their own `kind` discriminator so
		 * the remove handler can dispatch to the right action without
		 * peeking at filterKey shape.
		 *
		 * Heavy lifting (label resolution, plural handling, price chip
		 * formatting) lives in `./lib.js` so it's directly unit-testable
		 * without an Interactivity API runtime.
		 *
		 * @return {Array<object>} Array of pill descriptors (id, kind, filterKey, value, label, ariaLabel).
		 */
		get activePills() {
			const { state } = store( NAMESPACE );
			return buildActivePills( state );
		},
	},

	actions: {
		/**
		 * Remove the pill currently in `data-wp-each` scope. Dispatches on
		 * the pill's `kind`: a regular filter pill toggles its value off
		 * via setFilter (which removes it since the value is currently on),
		 * a price-range pill clears both bounds.
		 *
		 * @yield {Promise} setFilter or setPriceRange action.
		 */
		*onRemovePill() {
			const { actions } = store( NAMESPACE );
			const { pill } = getContext();
			if ( pill.kind === 'priceRange' ) {
				yield actions.setPriceRange( null, null );
				return;
			}
			yield actions.setFilter( pill.filterKey, pill.value );
		},
	},
} );
