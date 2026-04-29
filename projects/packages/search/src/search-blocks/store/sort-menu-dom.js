/**
 * Tiny DOM helpers used by the sort-popover ARIA menu keyboard handlers.
 *
 * The store's roving-tabindex code needs the ordered list of currently
 * rendered sort keys so it can wrap arrow-key navigation. The list is the
 * server-rendered `availableSortOptions` and isn't shipped through
 * Interactivity state — pulling it off the live menu DOM keeps server and
 * client in sync without duplicating the data, and matches the rest of the
 * sort block which already drives selection from the DOM (`event.currentTarget.value`).
 */

const MENU_SELECTOR = '.jetpack-search-sort__menu';
const ITEM_SELECTOR = '.jetpack-search-sort__menu-item';
const TRIGGER_SELECTOR = '.jetpack-search-sort__trigger';
const POPOVER_ROOT_SELECTOR = '[data-jetpack-search-popover-root]';

/**
 * Read the rendered sort keys from a menu element in DOM order. The
 * server emits one button per `availableSortOptions` entry and never
 * mutates that list, so reading `value` straight off the buttons is
 * a stable contract.
 *
 * @param {Element|null} menu - The menu container.
 * @return {string[]} Ordered sort keys, or an empty array when missing.
 */
function readMenuOptionKeys( menu ) {
	if ( ! menu ) {
		return [];
	}
	const items = menu.querySelectorAll( ITEM_SELECTOR );
	return Array.from( items, item => item.value ).filter( Boolean );
}

/**
 * Resolve the ordered sort keys when a menu item dispatched an event.
 * Walks up to the menu container and reads its children — handles the
 * case where the rendered options differ from the default base keys.
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
 * Resolve the ordered sort keys from the trigger button's popover root.
 * The trigger and menu share the same `[data-jetpack-search-popover-root]`
 * wrapper — find that, then locate the menu inside it.
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
 * Move focus back to the sort trigger when closing the menu via Escape
 * or after activating an item. Called with any element inside the popover
 * root (trigger or menu item) so we can locate the trigger reliably even
 * when the menu has already been hidden.
 *
 * @param {Element|null} elementInRoot - Any element inside the popover root.
 */
export function focusSortTrigger( elementInRoot ) {
	if ( ! elementInRoot ) {
		return;
	}
	const root = elementInRoot.closest?.( POPOVER_ROOT_SELECTOR );
	const trigger = root?.querySelector?.( TRIGGER_SELECTOR );
	trigger?.focus?.();
}
