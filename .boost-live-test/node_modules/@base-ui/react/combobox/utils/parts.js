"use strict";
'use client';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.clickHighlightedItem = clickHighlightedItem;
exports.getChipNavigationKeys = getChipNavigationKeys;
exports.getIndexAfterChipRemoval = getIndexAfterChipRemoval;
exports.useListEmpty = useListEmpty;
exports.usePopupSide = usePopupSide;
var _ComboboxRootContext = require("../root/ComboboxRootContext");
/**
 * The popup side is only meaningful while the positioner is mounted, as the store retains the
 * last resolved side after the popup unmounts.
 */
function usePopupSide(store) {
  const mounted = store.useState('mounted');
  const popupSide = store.useState('popupSide');
  const positionerElement = store.useState('positionerElement');
  return mounted && positionerElement ? popupSide : null;
}

/**
 * Whether the filtered list has no items to show.
 */
function useListEmpty() {
  return (0, _ComboboxRootContext.useComboboxDerivedItemsContext)().filteredItems.length === 0;
}

/**
 * The arrow keys that move the chip highlight backwards and forwards, in that order.
 */
function getChipNavigationKeys(direction) {
  return direction === 'rtl' ? ['ArrowRight', 'ArrowLeft'] : ['ArrowLeft', 'ArrowRight'];
}

/**
 * Where the highlight lands once the chip at `index` is removed, or `undefined` for no highlight.
 */
function getIndexAfterChipRemoval(index, chipCount) {
  const nextIndex = index >= chipCount - 1 ? chipCount - 2 : index;
  return nextIndex >= 0 ? nextIndex : undefined;
}

/**
 * Commits the highlighted item by clicking it, tagging the originating event so the item's
 * handler can attribute the selection to it.
 */
function clickHighlightedItem(store, activeIndex, nativeEvent) {
  const listItem = store.context.listRef.current[activeIndex];
  if (listItem) {
    store.context.selectionEventRef.current = nativeEvent;
    listItem.click();
    store.context.selectionEventRef.current = null;
  }
}