import { type ComboboxItemCollection } from "./itemCollection.js";
export type ComboboxPrimitiveValue = string | number | bigint | boolean;
type RemoveIndexSignature<Type> = { [Key in keyof Type as string extends Key ? never : number extends Key ? never : symbol extends Key ? never : Key]: Type[Key] };
/** Whether any constituent of `Item` explicitly declares an `items` field that may be an array. */
type HasGroupShape<Item> = Item extends object ? 'items' extends keyof RemoveIndexSignature<Item> ? [Extract<NonNullable<Item['items']>, ReadonlyArray<unknown>>] extends [never] ? never[] extends NonNullable<Item['items']> ? true : never : true : never : never;
type IsAny<T> = 0 extends 1 & T ? true : false;
type GroupShapedItemsError = 'Base UI: items passed to createItems() cannot have an `items` array property because it marks a group. Rename the field or cast the data.';
type RejectGroupShapedItems<Item> = IsAny<Item> extends true ? unknown : true extends HasGroupShape<Item> ? GroupShapedItemsError : unknown;
type ComboboxItemsData<Item> = (Extract<Item, {
  items: ReadonlyArray<unknown>;
}> extends never ? readonly Item[] : never) | readonly {
  items: ReadonlyArray<Item>;
}[];
export interface CreateComboboxItemsOptions<Item, Value extends ComboboxPrimitiveValue = ComboboxPrimitiveValue> {
  /**
   * Projects an item to the primitive value that identifies it, used as the item's
   * selection value.
   *
   * `null` and `undefined` are reserved for no selection, and each item must derive a unique
   * value. Prefer stable IDs from your application data.
   */
  getValue: (item: Item) => Value;
  /**
   * Projects an item to the label string that represents it in the input and when matching the
   * typed query. The root's `itemToStringLabel` prop is the fallback for values whose item is in
   * neither the data nor the current `filteredItems`.
   */
  getLabel: (item: Item) => string;
}
/**
 * Creates a collection for the root's `items` prop. Values and labels are derived on first use.
 *
 * Accepts either a flat item array or an array of groups. The `getValue` and `getLabel` accessors
 * receive items, not groups.
 *
 * Items cannot have an `items` array property because they would be interpreted as groups.
 * Rename that field or cast the data when the runtime values are known not to contain arrays.
 *
 * The data must not contain nullish entries: remove them before creating the collection, as for
 * the root's `items` prop.
 *
 * Create static collections at module scope. Wrap dynamic collections in `React.useMemo()` keyed
 * by their data.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 *
 * @param data The flat or grouped source items, or `undefined` while they are loading.
 * @param options Functions that derive each source item's selection value and display label.
 * @returns A collection whose selection value is the `getValue` accessor's return value.
 */
export declare function createComboboxItems<Item, Value extends ComboboxPrimitiveValue>(/** @type ComboboxItemsData<Item> | undefined */
data: (ComboboxItemsData<Item> & RejectGroupShapedItems<Item>) | undefined, options: CreateComboboxItemsOptions<Item, Value>): ComboboxItemCollection<Item, Value>;
export {};