"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ToolbarSeparator = void 0;
var React = _interopRequireWildcard(require("react"));
var _separator = require("../../separator");
var _ToolbarRootContext = require("../root/ToolbarRootContext");
var _jsxRuntime = require("react/jsx-runtime");
/**
 * A separator element accessible to screen readers.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Toolbar](https://base-ui.com/react/components/toolbar)
 */
const ToolbarSeparator = exports.ToolbarSeparator = /*#__PURE__*/React.forwardRef(function ToolbarSeparator(props, forwardedRef) {
  const context = (0, _ToolbarRootContext.useToolbarRootContext)();
  const orientation = context.orientation === 'vertical' ? 'horizontal' : 'vertical';
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_separator.Separator, {
    orientation: orientation,
    ...props,
    ref: forwardedRef
  });
});
if (process.env.NODE_ENV !== "production") ToolbarSeparator.displayName = "ToolbarSeparator";