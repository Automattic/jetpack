"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ComboboxPortal = void 0;
var React = _interopRequireWildcard(require("react"));
var _floatingUiReact = require("../../floating-ui-react");
var _ComboboxRootContext = require("../root/ComboboxRootContext");
var _ComboboxPortalContext = require("./ComboboxPortalContext");
var _jsxRuntime = require("react/jsx-runtime");
/**
 * A portal element that moves the popup to a different part of the DOM.
 * By default, the portal element is appended to `<body>`.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
const ComboboxPortal = exports.ComboboxPortal = /*#__PURE__*/React.forwardRef(function ComboboxPortal(props, forwardedRef) {
  const {
    keepMounted = false,
    ...portalProps
  } = props;
  const store = (0, _ComboboxRootContext.useComboboxRootContext)();
  const mounted = store.useState('mounted');
  const forceMounted = store.useState('forceMounted');
  const shouldRender = mounted || keepMounted || forceMounted;
  if (!shouldRender) {
    return null;
  }
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_ComboboxPortalContext.ComboboxPortalContext.Provider, {
    value: keepMounted,
    children: /*#__PURE__*/(0, _jsxRuntime.jsx)(_floatingUiReact.FloatingPortal, {
      ref: forwardedRef,
      ...portalProps
    })
  });
});
if (process.env.NODE_ENV !== "production") ComboboxPortal.displayName = "ComboboxPortal";