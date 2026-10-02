import { type Filter, type GetFilterParameters as UseFilterOptions, getFilter } from "../../../internals/filter.js";
export type { Filter, UseFilterOptions };
/**
 * Matches items against a query using `Intl.Collator` for robust string matching.
 */
export declare const useCoreFilter: typeof getFilter;
export interface UseComboboxFilterOptions extends UseFilterOptions {
  /**
   * Whether the combobox is in multiple selection mode.
   * @default false
   */
  multiple?: boolean | undefined;
  /**
   * The current value of the combobox, used to keep every item visible while the query still
   * matches the selection.
   */
  value?: any;
}
/**
 * Matches items against a query using `Intl.Collator` for robust string matching.
 */
export declare function useComboboxFilter(options?: UseComboboxFilterOptions): Filter;