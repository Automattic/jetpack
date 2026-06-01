import { store, getContext, getElement } from '@wordpress/interactivity';
import 'jetpack-search/store';
import './style.scss';

const NAMESPACE = 'jetpack-search';

store( NAMESPACE, {
	state: {
		/**
		 * `data-wp-bind--checked` for radio variants. The wrapper context
		 * carries each option's `sortKey`; the `<select>` variant binds
		 * `value` directly and ignores this getter.
		 *
		 * @return {boolean} Whether this option is the active sort.
		 */
		get isSortOptionSelected() {
			const { state } = store( NAMESPACE );
			const { sortKey } = getContext();
			return state.sortOrder === sortKey;
		},

		/**
		 * Roving-tabindex value (ARIA menu pattern — only the active descendant
		 * is in the tab order so Tab leaves the menu). Falls back to
		 * `state.sortOrder` so the menu opens with focus on the active sort.
		 *
		 * @return {string} `"0"` for active descendant, else `"-1"`.
		 */
		get sortMenuItemTabIndex() {
			const { state } = store( NAMESPACE );
			const { sortKey } = getContext();
			const active = state.sortMenuFocusedKey ?? state.sortOrder;
			return active === sortKey ? '0' : '-1';
		},
	},
	callbacks: {
		/**
		 * Move focus to the active descendant after keyboard interaction.
		 * Gated on `isSortPopoverOpen` + `sortMenuFocusedKey` so mouse opens
		 * don't pull focus from whatever the user was clicking.
		 */
		focusSelectedSortMenuItem() {
			const { state } = store( NAMESPACE );
			if ( ! state.isSortPopoverOpen || state.sortMenuFocusedKey === null ) {
				return;
			}
			const { sortKey } = getContext();
			if ( sortKey !== state.sortMenuFocusedKey ) {
				return;
			}
			const { ref } = getElement();
			ref?.focus?.();
		},
	},
	actions: {
		/**
		 * Apply a new sort and re-run. Shared between `<select>` and radio
		 * change events — `event.target.value` carries the key in both.
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
