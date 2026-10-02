"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SelectPortal = void 0;
var React = _interopRequireWildcard(require("react"));
var _floatingUiReact = require("../../floating-ui-react");
var _SelectRootContext = require("../root/SelectRootContext");
var _jsxRuntime = require("react/jsx-runtime");
/**
 * A portal element that moves the popup to a different part of the DOM.
 * By default, the portal element is appended to `<body>`.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
const SelectPortal = exports.SelectPortal = /*#__PURE__*/React.forwardRef(function SelectPortal(portalProps, forwardedRef) {
  const store = (0, _SelectRootContext.useSelectRootContext)();
  const mounted = store.useState('mounted');
  const forceMount = store.useState('forceMount');
  const shouldRender = mounted || forceMount;
  if (!shouldRender) {
    return null;
  }
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_floatingUiReact.FloatingPortal, {
    ref: forwardedRef,
    ...portalProps
  });
});
if (process.env.NODE_ENV !== "production") SelectPortal.displayName = "SelectPortal";