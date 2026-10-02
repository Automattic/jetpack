type ItemComparer<Item> = (a: Item, b: Item) => boolean;
/**
 * Compares two arrays element-wise.
 *
 * The default comparison is `Object.is`, so `NaN` equals `NaN` and `0` does not equal `-0`.
 */
export declare function areArraysEqual<Item>(array1: ReadonlyArray<Item>, array2: ReadonlyArray<Item>, itemComparer?: ItemComparer<Item>): boolean;
export {};