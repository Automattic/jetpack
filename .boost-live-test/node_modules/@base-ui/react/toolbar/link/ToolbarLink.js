"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ToolbarLink = void 0;
var React = _interopRequireWildcard(require("react"));
var _ToolbarRootContext = require("../root/ToolbarRootContext");
var _CompositeItem = require("../../internals/composite/item/CompositeItem");
var _jsxRuntime = require("react/jsx-runtime");
const TOOLBAR_LINK_METADATA = {
  // Links cannot be disabled, but they still occupy a focusable composite item slot.
  disabled: false,
  focusableWhenDisabled: true
};

/**
 * A link component.
 * Renders an `<a>` element.
 *
 * Documentation: [Base UI Toolbar](https://base-ui.com/react/components/toolbar)
 */
const ToolbarLink = exports.ToolbarLink = /*#__PURE__*/React.forwardRef(function ToolbarLink(componentProps, forwardedRef) {
  const {
    className,
    render,
    style,
    ...elementProps
  } = componentProps;
  const {
    orientation
  } = (0, _ToolbarRootContext.useToolbarRootContext)();
  const state = {
    orientation
  };
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_CompositeItem.CompositeItem, {
    tag: "a",
    render: render,
    className: className,
    style: style,
    metadata: TOOLBAR_LINK_METADATA,
    state: state,
    refs: [forwardedRef],
    props: [elementProps]
  });
});
if (process.env.NODE_ENV !== "production") ToolbarLink.displayName = "ToolbarLink";