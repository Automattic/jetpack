import { store, getContext } from '@wordpress/interactivity';
import '../../store';
import './style.scss';

const NAMESPACE = 'jetpack-search';

store( NAMESPACE, {
	state: {
		/**
		 * Whether the radio currently in scope (per-item context's
		 * `optionValue`) matches the selected blog filter. Single-select:
		 * activeFilters carries at most one value for a radio filter.
		 *
		 * @return {boolean} True when this option is the active selection.
		 */
		get isBlogOptionChecked() {
			const { state } = store( NAMESPACE );
			const { filterKey, optionValue } = getContext();
			const selected = state.activeFilters?.[ filterKey ] ?? [];
			return selected[ 0 ] === optionValue;
		},
	},

	actions: {
		/**
		 * Replace the selected blog when a radio is clicked. Native radios
		 * don't deselect by clicking the same option, so this action only
		 * sets a value — the active-filters pill X is the clear path.
		 *
		 * @param {Event} event - Change event.
		 * @yield {Promise} setRadioFilter action.
		 */
		*onBlogFilterChange( event ) {
			const { actions } = store( NAMESPACE );
			const { filterKey } = getContext();
			yield actions.setRadioFilter( filterKey, event.target.value );
		},
	},
} );
