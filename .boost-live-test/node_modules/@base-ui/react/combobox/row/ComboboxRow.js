"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ComboboxRow = void 0;
var React = _interopRequireWildcard(require("react"));
var _useRenderElement = require("../../internals/useRenderElement");
var _ComboboxRowContext = require("./ComboboxRowContext");
var _jsxRuntime = require("react/jsx-runtime");
/**
 * Displays a single row of items in a grid list.
 * Enable `grid` on the root component to turn the listbox into a grid.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
const ComboboxRow = exports.ComboboxRow = /*#__PURE__*/React.forwardRef(function ComboboxRow(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    ...elementProps
  } = componentProps;
  const element = (0, _useRenderElement.useRenderElement)('div', componentProps, {
    ref: forwardedRef,
    props: [{
      role: 'row'
    }, elementProps]
  });
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_ComboboxRowContext.ComboboxRowContext.Provider, {
    value: true,
    children: element
  });
});
if (process.env.NODE_ENV !== "production") ComboboxRow.displayName = "ComboboxRow";