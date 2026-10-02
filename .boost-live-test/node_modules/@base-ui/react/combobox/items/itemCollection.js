"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.findCollectionItem = findCollectionItem;
var _itemEquality = require("../../internals/itemEquality");
function findCollectionItem(valueToItem, itemValue, isEqual) {
  const exactItem = valueToItem.get(itemValue);
  if (exactItem !== undefined || isEqual === _itemEquality.defaultItemEquality) {
    return exactItem;
  }
  for (const [derivedValue, item] of valueToItem) {
    if ((0, _itemEquality.compareItemEquality)(derivedValue, itemValue, isEqual)) {
      return item;
    }
  }
  return undefined;
}

/**
 * An opaque collection created by `createItems()`.
 *
 * It carries the source item and derived value types so the root can infer the list item and
 * selection value types.
 *
 * Pass it directly to the root's `items` prop; it has no public members.
 */

/**
 * Internal shape of a collection. The extra members let the root project items to
 * their values and resolve a selected value back to its label while items are unmounted.
 */