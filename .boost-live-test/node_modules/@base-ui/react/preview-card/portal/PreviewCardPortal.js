"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PreviewCardPortal = void 0;
var React = _interopRequireWildcard(require("react"));
var _PreviewCardContext = require("../root/PreviewCardContext");
var _PreviewCardPortalContext = require("./PreviewCardPortalContext");
var _FloatingPortalLite = require("../../utils/FloatingPortalLite");
var _jsxRuntime = require("react/jsx-runtime");
/**
 * A portal element that moves the popup to a different part of the DOM.
 * By default, the portal element is appended to `<body>`.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Preview Card](https://base-ui.com/react/components/preview-card)
 */
const PreviewCardPortal = exports.PreviewCardPortal = /*#__PURE__*/React.forwardRef(function PreviewCardPortal(props, forwardedRef) {
  const {
    keepMounted = false,
    ...portalProps
  } = props;
  const store = (0, _PreviewCardContext.usePreviewCardRootContext)();
  const mounted = store.useState('mounted');
  const shouldRender = mounted || keepMounted;
  if (!shouldRender) {
    return null;
  }
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_PreviewCardPortalContext.PreviewCardPortalContext.Provider, {
    value: keepMounted,
    children: /*#__PURE__*/(0, _jsxRuntime.jsx)(_FloatingPortalLite.FloatingPortalLite, {
      ref: forwardedRef,
      ...portalProps
    })
  });
});
if (process.env.NODE_ENV !== "production") PreviewCardPortal.displayName = "PreviewCardPortal";