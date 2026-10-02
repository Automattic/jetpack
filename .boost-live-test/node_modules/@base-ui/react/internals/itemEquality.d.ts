export type ItemEqualityComparer<Item = any, Value = Item> = (itemValue: Item, selectedValue: Value) => boolean;
export declare const defaultItemEquality: ItemEqualityComparer;
export declare function compareItemEquality<Item, Value>(itemValue: Item, selectedValue: Value, comparer: ItemEqualityComparer<Item, Value>): boolean;
export declare function isSelectedValueDirty(currentValue: unknown, initialValue: unknown, comparer: ItemEqualityComparer): boolean;
export declare function selectedValueIncludes<Item, Value>(selectedValues: readonly Item[] | undefined | null, itemValue: Value, comparer: ItemEqualityComparer<Value, Item>): boolean;
export declare function findItemIndex<Item, Value>(itemValues: readonly Item[] | undefined | null, selectedValue: Value, comparer: ItemEqualityComparer<Item, Value>): number;
export declare function findSelectionIndex<Item, Value>(itemValues: readonly Item[], selectedValue: Value | readonly Value[] | null | undefined, comparer: ItemEqualityComparer<Item, Value>, multiple: boolean): number | null;
/** Resolves the first selected index as items register or change. */
export declare function resolveSelectedIndex<Item, Value>(index: number, itemValue: Item, registry: readonly Item[], selectedValues: readonly Value[], comparer: ItemEqualityComparer<Item, Value>, currentIndex: number | null): number | null;
export declare function removeItem<Item, Value>(selectedValues: readonly Item[], itemValue: Value, comparer: ItemEqualityComparer<Value, Item>): Item[];