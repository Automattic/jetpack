import type { ComboboxStore } from "../store.mjs";
import type { Side } from "../../internals/useAnchorPositioning.mjs";
/**
 * The popup side is only meaningful while the positioner is mounted, as the store retains the
 * last resolved side after the popup unmounts.
 */
export declare function usePopupSide(store: ComboboxStore): Side | null;
/**
 * Whether the filtered list has no items to show.
 */
export declare function useListEmpty(): boolean;
/**
 * The arrow keys that move the chip highlight backwards and forwards, in that order.
 */
export declare function getChipNavigationKeys(direction: 'ltr' | 'rtl'): readonly ["ArrowLeft", "ArrowRight"] | readonly ["ArrowRight", "ArrowLeft"];
/**
 * Where the highlight lands once the chip at `index` is removed, or `undefined` for no highlight.
 */
export declare function getIndexAfterChipRemoval(index: number, chipCount: number): number | undefined;
/**
 * Commits the highlighted item by clicking it, tagging the originating event so the item's
 * handler can attribute the selection to it.
 */
export declare function clickHighlightedItem(store: ComboboxStore, activeIndex: number, nativeEvent: KeyboardEvent): void;