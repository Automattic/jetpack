"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useFilteredItems = useFilteredItems;
var _ComboboxRootContext = require("../ComboboxRootContext");
/**
 * Returns the internally filtered items.
 * Treat the result as read-only: it is internal state and may be a shared frozen array.
 */
function useFilteredItems() {
  const items = (0, _ComboboxRootContext.useComboboxDerivedItemsContext)();
  return items.filteredItems;
}