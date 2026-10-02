"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.NavigationMenuPortal = void 0;
var React = _interopRequireWildcard(require("react"));
var _floatingUiReact = require("../../floating-ui-react");
var _NavigationMenuRootContext = require("../root/NavigationMenuRootContext");
var _NavigationMenuPortalContext = require("./NavigationMenuPortalContext");
var _jsxRuntime = require("react/jsx-runtime");
/**
 * A portal element that moves the popup to a different part of the DOM.
 * By default, the portal element is appended to `<body>`.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 */
const NavigationMenuPortal = exports.NavigationMenuPortal = /*#__PURE__*/React.forwardRef(function NavigationMenuPortal(props, forwardedRef) {
  const {
    keepMounted = false,
    ...portalProps
  } = props;
  const {
    mounted
  } = (0, _NavigationMenuRootContext.useNavigationMenuRootContext)();
  const shouldRender = mounted || keepMounted;
  if (!shouldRender) {
    return null;
  }
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_NavigationMenuPortalContext.NavigationMenuPortalContext.Provider, {
    value: keepMounted,
    children: /*#__PURE__*/(0, _jsxRuntime.jsx)(_floatingUiReact.FloatingPortal, {
      ref: forwardedRef,
      ...portalProps
    })
  });
});
if (process.env.NODE_ENV !== "production") NavigationMenuPortal.displayName = "NavigationMenuPortal";