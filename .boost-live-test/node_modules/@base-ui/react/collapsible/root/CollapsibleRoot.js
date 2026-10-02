"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CollapsibleRoot = void 0;
var React = _interopRequireWildcard(require("react"));
var _useStableCallback = require("@base-ui/utils/useStableCallback");
var _useRenderElement = require("../../internals/useRenderElement");
var _useCollapsibleRoot = require("./useCollapsibleRoot");
var _CollapsibleRootContext = require("./CollapsibleRootContext");
var _stateAttributesMapping = require("./stateAttributesMapping");
var _jsxRuntime = require("react/jsx-runtime");
/**
 * Groups all parts of the collapsible.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Collapsible](https://base-ui.com/react/components/collapsible)
 */
const CollapsibleRoot = exports.CollapsibleRoot = /*#__PURE__*/React.forwardRef(function CollapsibleRoot(componentProps, forwardedRef) {
  const {
    render,
    className,
    defaultOpen = false,
    disabled = false,
    onOpenChange: onOpenChangeProp,
    open,
    style,
    ...elementProps
  } = componentProps;
  const onOpenChange = (0, _useStableCallback.useStableCallback)(onOpenChangeProp);
  const collapsible = (0, _useCollapsibleRoot.useCollapsibleRoot)({
    open,
    defaultOpen,
    onOpenChange,
    disabled
  });
  const state = React.useMemo(() => ({
    open: collapsible.open,
    disabled: collapsible.disabled,
    transitionStatus: collapsible.transitionStatus
  }), [collapsible.open, collapsible.disabled, collapsible.transitionStatus]);
  const contextValue = React.useMemo(() => ({
    ...collapsible,
    onOpenChange,
    state
  }), [collapsible, onOpenChange, state]);
  const element = (0, _useRenderElement.useRenderElement)('div', componentProps, {
    state,
    ref: forwardedRef,
    props: elementProps,
    stateAttributesMapping: _stateAttributesMapping.collapsibleStateAttributesMapping
  });
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_CollapsibleRootContext.CollapsibleRootContext.Provider, {
    value: contextValue,
    children: element
  });
});
if (process.env.NODE_ENV !== "production") CollapsibleRoot.displayName = "CollapsibleRoot";