"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createCollatorItemFilter = createCollatorItemFilter;
exports.createSingleSelectionCollatorFilter = createSingleSelectionCollatorFilter;
exports.getComboboxPopupId = getComboboxPopupId;
var _resolveValueLabel = require("../../../internals/resolveValueLabel");
/**
 * Derives the default id assigned to `Combobox.Popup` when the input is rendered inside it.
 * Shared by the popup (which applies it) and the trigger (which references it via `aria-controls`)
 * so the convention only lives in one place.
 */
function getComboboxPopupId(rootId) {
  return rootId == null ? undefined : `${rootId}-popup`;
}

/**
 * Enhanced filter using Intl.Collator for more robust string matching.
 * Uses the provided `itemToStringLabel` function if available, otherwise falls back to:
 * • When `item` is an object with a `value` property, that property is used.
 * • When `item` is a primitive (e.g. `string`), it is used directly.
 */
function createCollatorItemFilter(collatorFilter, itemToStringLabel) {
  return (item, query) => {
    if (item == null) {
      return false;
    }
    return collatorFilter.contains(item, query, itemToStringLabel);
  };
}

/**
 * Enhanced filter for single selection mode using Intl.Collator that shows all items
 * when query is empty or matches the current selection, making it easier to browse options.
 */
function createSingleSelectionCollatorFilter(collatorFilter, itemToStringLabel, selectedValue) {
  return (item, query) => {
    if (item == null) {
      return false;
    }
    if (!query) {
      return true;
    }
    const selectedValueToString = itemToStringLabel?.selected ?? itemToStringLabel;
    const selectedString = selectedValue != null ? (0, _resolveValueLabel.stringifyAsLabel)(selectedValue, selectedValueToString) : '';

    // Handle case-insensitive matching consistently
    if (selectedString && collatorFilter.contains(selectedString, query) && selectedString.length === query.length) {
      return true;
    }
    return collatorFilter.contains(item, query, itemToStringLabel);
  };
}