import * as React from 'react';
import { ComboboxStore } from "../store.js";
export interface ComboboxDerivedItemsContext {
  query: string;
  hasItems: boolean;
  filteredItems: any[];
  /**
   * `filteredItems` flattened across groups and projected to selection values. Identical to the
   * items themselves unless `items` is a `createItems()` collection.
   */
  flatFilteredValues: any[];
}
export declare const ComboboxRootContext: React.Context<ComboboxStore | undefined>;
export declare const ComboboxFloatingContext: React.Context<import("../../floating-ui-react/components/FloatingRootStore.js").FloatingRootStore | undefined>;
export declare const ComboboxDerivedItemsContext: React.Context<ComboboxDerivedItemsContext | undefined>;
export declare const ComboboxHasItemsContext: React.Context<boolean>;
export declare const ComboboxInputValueContext: React.Context<string | number | readonly string[] | undefined>;
export declare function useComboboxRootContext(): ComboboxStore;
export declare function useComboboxFloatingContext(): import("../../floating-ui-react/components/FloatingRootStore.js").FloatingRootStore;
export declare function useComboboxDerivedItemsContext(): ComboboxDerivedItemsContext;
export declare function useComboboxInputValueContext(): string | number | readonly string[] | undefined;
export declare function useComboboxHasItemsContext(): boolean;