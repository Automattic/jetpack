import { store, getContext } from '@wordpress/interactivity';
import '../../store';
import './style.scss';

const NAMESPACE = 'jetpack-search';

store( NAMESPACE, {
	state: {
		/**
		 * Bound to each radio input's `checked` attribute so the visible
		 * selection stays in sync with `state.sortOrder` across popstate
		 * navigations and programmatic updates. Each radio's wrapper carries
		 * a `data-wp-context='{"sortKey":"…"}'` with its own sort key — the
		 * getter reads that via `getContext()` and compares against the
		 * single shared `state.sortOrder`.
		 *
		 * Unused by the `<select>` variant, which binds `value` directly
		 * against the store state.
		 *
		 * @return {boolean} True when this radio represents the active sort.
		 */
		get isSortOptionSelected() {
			const { state } = store( NAMESPACE );
			const { sortKey } = getContext();
			return state.sortOrder === sortKey;
		},
	},
	actions: {
		/**
		 * Apply a new sort order and re-run search. Shared between the
		 * `<select>` change event and radio change events; `event.target.value`
		 * carries the selected sort key in both cases.
		 *
		 * @param {Event} event - Change event.
		 * @yield {Promise} search action.
		 */
		*onSortChange( event ) {
			const { state, actions } = store( NAMESPACE );
			state.sortOrder = event.target.value;
			yield actions.search();
		},
	},
} );
