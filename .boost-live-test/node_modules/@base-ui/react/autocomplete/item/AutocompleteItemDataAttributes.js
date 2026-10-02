"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.highlighted = exports.disabled = void 0;
var ComboboxItemDataAttributes = _interopRequireWildcard(require("../../combobox/item/ComboboxItemDataAttributes"));
/**
 * Present when the item is highlighted.
 */
const highlighted = exports.highlighted = ComboboxItemDataAttributes.highlighted;
/**
 * Present when the item is disabled.
 */
const disabled = exports.disabled = ComboboxItemDataAttributes.disabled;