import { useComboboxDerivedItemsContext } from "../ComboboxRootContext.mjs";

/**
 * Returns the internally filtered items.
 * Treat the result as read-only: it is internal state and may be a shared frozen array.
 */
export function useFilteredItems() {
  const items = useComboboxDerivedItemsContext();
  return items.filteredItems;
}