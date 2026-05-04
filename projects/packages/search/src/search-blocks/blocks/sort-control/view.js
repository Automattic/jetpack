import { store, getContext, getElement } from '@wordpress/interactivity';
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

		/**
		 * Roving-tabindex value for a sort-popover menu item. Implements
		 * the ARIA menu keyboard pattern: only one item is in the tab
		 * order at a time — the active descendant — so Tab leaves the
		 * menu rather than cycling every option. Active descendant is
		 * `state.sortMenuFocusedKey` once the user has navigated with the
		 * keyboard, and falls back to the currently selected
		 * `state.sortOrder` so the menu opens with focus on the active
		 * sort.
		 *
		 * @return {string} `"0"` when this item is the active descendant, `"-1"` otherwise.
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
		 * Move keyboard focus onto the active sort menu item when it
		 * becomes the roving-tabindex target. Runs from a `data-wp-watch`
		 * on each menu item, so re-fires whenever `sortMenuItemTabIndex`
		 * flips. Gated on `state.isSortPopoverOpen` so we don't pull
		 * focus into a hidden menu and on `sortMenuFocusedKey` so the
		 * focus only moves after explicit keyboard interaction — opening
		 * the popover with the mouse leaves focus on whatever the user
		 * was clicking.
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
