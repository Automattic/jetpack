"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DialogPortal = void 0;
var React = _interopRequireWildcard(require("react"));
var _inertValue = require("@base-ui/utils/inertValue");
var _floatingUiReact = require("../../floating-ui-react");
var _DialogRootContext = require("../root/DialogRootContext");
var _DialogPortalContext = require("./DialogPortalContext");
var _InternalBackdrop = require("../../utils/InternalBackdrop");
var _jsxRuntime = require("react/jsx-runtime");
/**
 * A portal element that moves the popup to a different part of the DOM.
 * By default, the portal element is appended to `<body>`.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 */
const DialogPortal = exports.DialogPortal = /*#__PURE__*/React.forwardRef(function DialogPortal(props, forwardedRef) {
  const {
    keepMounted = false,
    ...portalProps
  } = props;
  const store = (0, _DialogRootContext.useDialogRootContext)();
  const mounted = store.useState('mounted');
  const modal = store.useState('modal');
  const open = store.useState('open');
  const shouldRender = mounted || keepMounted;
  if (!shouldRender) {
    return null;
  }
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_DialogPortalContext.DialogPortalContext.Provider, {
    value: keepMounted,
    children: /*#__PURE__*/(0, _jsxRuntime.jsxs)(_floatingUiReact.FloatingPortal, {
      ref: forwardedRef,
      ...portalProps,
      children: [mounted && modal === true && /*#__PURE__*/(0, _jsxRuntime.jsx)(_InternalBackdrop.InternalBackdrop, {
        ref: store.context.internalBackdropRef,
        inert: (0, _inertValue.inertValue)(!open)
      }), props.children]
    })
  });
});
if (process.env.NODE_ENV !== "production") DialogPortal.displayName = "DialogPortal";