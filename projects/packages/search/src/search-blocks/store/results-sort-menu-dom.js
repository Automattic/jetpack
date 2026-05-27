/**
 * DOM helpers for the sort-popover ARIA menu. Read the rendered sort keys
 * straight off the live menu rather than threading `availableSortOptions`
 * through IA state — matches the rest of the sort block, which already
 * drives selection from `event.currentTarget.value`.
 */

const MENU_SELECTOR = '.jetpack-search-results-sort__menu';
const ITEM_SELECTOR = '.jetpack-search-results-sort__menu-item';
const TRIGGER_SELECTOR = '.jetpack-search-results-sort__trigger';
const POPOVER_ROOT_SELECTOR = '[data-jetpack-search-popover-root]';

/**
 * Sort keys from a menu element in DOM order.
 *
 * @param {Element|null} menu - Menu container.
 * @return {string[]} Ordered sort keys.
 */
function readMenuOptionKeys( menu ) {
	if ( ! menu ) {
		return [];
	}
	const items = menu.querySelectorAll( ITEM_SELECTOR );
	return Array.from( items, item => item.value ).filter( Boolean );
}

/**
 * Sort keys, given a menu item.
 *
 * @param {Element|null} menuItem - The menu-item button.
 * @return {string[]} Ordered sort keys.
 */
export function getSortMenuOptionKeysFromItem( menuItem ) {
	if ( ! menuItem ) {
		return [];
	}
	const menu = menuItem.closest?.( MENU_SELECTOR );
	return readMenuOptionKeys( menu );
}

/**
 * Sort keys, given the trigger button (trigger + menu share the popover root).
 *
 * @param {Element|null} trigger - The trigger button.
 * @return {string[]} Ordered sort keys.
 */
export function getSortMenuOptionKeysFromTrigger( trigger ) {
	if ( ! trigger ) {
		return [];
	}
	const root = trigger.closest?.( POPOVER_ROOT_SELECTOR );
	const menu = root?.querySelector?.( MENU_SELECTOR );
	return readMenuOptionKeys( menu );
}

/**
 * Focus the trigger when closing via Escape / after activation. Accepts any
 * element in the popover root so we can find the trigger even when the menu
 * has been hidden.
 *
 * @param {Element|null} elementInRoot - Element inside the popover root.
 */
export function focusSortTrigger( elementInRoot ) {
	if ( ! elementInRoot ) {
		return;
	}
	const root = elementInRoot.closest?.( POPOVER_ROOT_SELECTOR );
	const trigger = root?.querySelector?.( TRIGGER_SELECTOR );
	trigger?.focus?.();
}
