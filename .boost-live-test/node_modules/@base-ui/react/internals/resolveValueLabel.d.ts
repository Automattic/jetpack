import * as React from 'react';
type ItemRecord = Record<string, React.ReactNode>;
type ItemsInput = ItemRecord | ReadonlyArray<LabeledItem> | ReadonlyArray<Group<any>> | undefined;
interface LabeledItem {
  value: any;
  label: React.ReactNode;
}
export interface Group<Item = any> {
  [key: string]: unknown;
  items: ReadonlyArray<Item>;
}
export declare function isGroupedItems(items: ReadonlyArray<any | Group<any>> | undefined): items is ReadonlyArray<Group<any>>;
export declare function flattenLeafItems<Item>(items: readonly Item[] | readonly Group<Item>[]): readonly Item[];
/**
 * Checks if the items array contains an item with a null value that has a non-null label.
 */
export declare function hasNullItemLabel(items: ItemsInput): boolean;
export declare function stringifyAsLabel(item: any, itemToStringLabel?: (item: any) => string): string;
export declare function stringifyAsValue(item: any, itemToStringValue?: (item: any) => string): string;
export declare function resolveSelectedLabel(value: any, items: ItemsInput, itemToStringLabel?: (item: any) => string): React.ReactNode;
export declare function resolveMultipleLabels(values: any[], items: ItemsInput, itemToStringLabel?: (item: any) => string): React.ReactNode;
export {};