"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MenuPortal = void 0;
var React = _interopRequireWildcard(require("react"));
var _floatingUiReact = require("../../floating-ui-react");
var _MenuRootContext = require("../root/MenuRootContext");
var _MenuPortalContext = require("./MenuPortalContext");
var _jsxRuntime = require("react/jsx-runtime");
/**
 * A portal element that moves the popup to a different part of the DOM.
 * By default, the portal element is appended to `<body>`.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
const MenuPortal = exports.MenuPortal = /*#__PURE__*/React.forwardRef(function MenuPortal(props, forwardedRef) {
  const {
    keepMounted = false,
    ...portalProps
  } = props;
  const {
    store,
    parent
  } = (0, _MenuRootContext.useMenuRootContext)();
  const mounted = store.useState('mounted');
  const shouldRender = mounted || keepMounted;
  if (!shouldRender) {
    return null;
  }

  // The hidden `aria-owns` owner renders here, in the React tree, so the role must be decided by
  // where this portal sits, not by the active trigger. `parent` comes from context (the `Menu.Root`
  // position), unlike the store's `parent`, which a detached trigger overwrites with its own.
  const portalOwnerRole = parent.type === 'menu' || parent.type === 'menubar' ? 'group' : undefined;
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_MenuPortalContext.MenuPortalContext.Provider, {
    value: keepMounted,
    children: /*#__PURE__*/(0, _jsxRuntime.jsx)(_floatingUiReact.FloatingPortal, {
      ref: forwardedRef,
      ...portalProps,
      portalOwnerRole: portalOwnerRole
    })
  });
});
if (process.env.NODE_ENV !== "production") MenuPortal.displayName = "MenuPortal";