import type * as React from 'react';
import { type DisabledIndices } from "../utils/composite.js";
/**
 * Positional arguments are deliberate: property names of an options object
 * don't minify, and the signature is locked to the caller via `typeof` on the
 * `grid` option of `useListNavigation`.
 *
 * The injected grid navigator only ever operates on a uniform 1x1 grid (sizes are
 * always `1x1` and packing is never dense), so the cell-map machinery that supports
 * multi-cell items collapses to an identity transform over the item list. Calling
 * `getGridNavigatedIndex` directly keeps the cell-map helpers
 * (`createGridCellMap`/`getGridCellIndexOfCorner`/`getGridCellIndices`) out of
 * grid-combobox bundles.
 */
export declare function gridNavigation(event: React.KeyboardEvent, prevIndex: number, listRef: React.RefObject<Array<HTMLElement | null>>, orientation: 'horizontal' | 'vertical' | 'both', loopFocus: boolean, rtl: boolean, disabledIndices: DisabledIndices | undefined, minIndex: number, maxIndex: number, cols?: number): number | undefined;