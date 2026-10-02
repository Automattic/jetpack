"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ComboboxCollection = ComboboxCollection;
var React = _interopRequireWildcard(require("react"));
var _ComboboxRootContext = require("../root/ComboboxRootContext");
var _GroupCollectionContext = require("./GroupCollectionContext");
var _jsxRuntime = require("react/jsx-runtime");
/**
 * Renders filtered list items.
 * Doesn't render its own HTML element.
 *
 * If rendering a flat list, pass a function child to the `List` component instead, which implicitly wraps it.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
function ComboboxCollection(props) {
  const {
    children
  } = props;
  const {
    filteredItems
  } = (0, _ComboboxRootContext.useComboboxDerivedItemsContext)();
  const groupContext = (0, _GroupCollectionContext.useGroupCollectionContext)();
  const itemsToRender = groupContext ? groupContext.items : filteredItems;
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(React.Fragment, {
    children: itemsToRender.map(children)
  });
}