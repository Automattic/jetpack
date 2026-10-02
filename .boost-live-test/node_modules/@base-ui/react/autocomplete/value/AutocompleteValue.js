"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AutocompleteValue = AutocompleteValue;
var React = _interopRequireWildcard(require("react"));
var _ComboboxRootContext = require("../../combobox/root/ComboboxRootContext");
var _jsxRuntime = require("react/jsx-runtime");
/**
 * The current value of the autocomplete.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Autocomplete](https://base-ui.com/react/components/autocomplete)
 */
function AutocompleteValue(props) {
  const {
    children
  } = props;
  const inputValue = (0, _ComboboxRootContext.useComboboxInputValueContext)();
  let returnValue = null;
  if (typeof children === 'function') {
    returnValue = children(String(inputValue));
  } else if (children != null) {
    returnValue = children;
  } else {
    returnValue = inputValue;
  }
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(React.Fragment, {
    children: returnValue
  });
}