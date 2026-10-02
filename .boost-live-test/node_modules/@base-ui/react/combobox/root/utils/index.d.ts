import type { Filter } from "./useFilter.js";
export type FilterItemToString = ((item: any) => string) & {
  selected?: ((value: any) => string) | undefined;
};
/**
 * Derives the default id assigned to `Combobox.Popup` when the input is rendered inside it.
 * Shared by the popup (which applies it) and the trigger (which references it via `aria-controls`)
 * so the convention only lives in one place.
 */
export declare function getComboboxPopupId(rootId: string | null | undefined): string | undefined;
/**
 * Enhanced filter using Intl.Collator for more robust string matching.
 * Uses the provided `itemToStringLabel` function if available, otherwise falls back to:
 * • When `item` is an object with a `value` property, that property is used.
 * • When `item` is a primitive (e.g. `string`), it is used directly.
 */
export declare function createCollatorItemFilter(collatorFilter: Filter, itemToStringLabel?: FilterItemToString): (item: any, query: string) => boolean;
/**
 * Enhanced filter for single selection mode using Intl.Collator that shows all items
 * when query is empty or matches the current selection, making it easier to browse options.
 */
export declare function createSingleSelectionCollatorFilter(collatorFilter: Filter, itemToStringLabel?: FilterItemToString, selectedValue?: any): (item: any, query: string) => boolean;