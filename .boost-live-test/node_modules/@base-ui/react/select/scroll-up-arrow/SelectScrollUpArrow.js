"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SelectScrollUpArrow = void 0;
var React = _interopRequireWildcard(require("react"));
var _SelectScrollArrow = require("../scroll-arrow/SelectScrollArrow");
var _jsxRuntime = require("react/jsx-runtime");
/**
 * An element that scrolls the select popup up when hovered. Does not render when using touch input.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
const SelectScrollUpArrow = exports.SelectScrollUpArrow = /*#__PURE__*/React.forwardRef(function SelectScrollUpArrow(props, forwardedRef) {
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_SelectScrollArrow.SelectScrollArrow, {
    ...props,
    ref: forwardedRef,
    direction: "up"
  });
});
if (process.env.NODE_ENV !== "production") SelectScrollUpArrow.displayName = "SelectScrollUpArrow";