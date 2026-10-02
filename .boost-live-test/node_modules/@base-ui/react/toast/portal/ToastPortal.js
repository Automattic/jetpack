"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ToastPortal = void 0;
var React = _interopRequireWildcard(require("react"));
var _FloatingPortalLite = require("../../utils/FloatingPortalLite");
var _jsxRuntime = require("react/jsx-runtime");
/**
 * A portal element that moves the viewport to a different part of the DOM.
 * By default, the portal element is appended to `<body>`.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 */
const ToastPortal = exports.ToastPortal = /*#__PURE__*/React.forwardRef(function ToastPortal(props, forwardedRef) {
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_FloatingPortalLite.FloatingPortalLite, {
    ref: forwardedRef,
    ...props
  });
});
if (process.env.NODE_ENV !== "production") ToastPortal.displayName = "ToastPortal";