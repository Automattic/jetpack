"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PopoverViewport = void 0;
var React = _interopRequireWildcard(require("react"));
var _PopoverRootContext = require("../root/PopoverRootContext");
var _PopoverPositionerContext = require("../positioner/PopoverPositionerContext");
var _useRenderElement = require("../../internals/useRenderElement");
var _usePopupViewport = require("../../utils/usePopupViewport");
/**
 * A viewport for displaying content transitions.
 * This component is only required if one popup can be opened by multiple triggers, its content
 * changes based on the trigger, and switching between them is animated.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
 */
const PopoverViewport = exports.PopoverViewport = /*#__PURE__*/React.forwardRef(function PopoverViewport(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    children,
    ...elementProps
  } = componentProps;
  const store = (0, _PopoverRootContext.usePopoverRootContext)();
  const {
    side
  } = (0, _PopoverPositionerContext.usePopoverPositionerContext)();
  const instantType = store.useState('instantType');
  const {
    children: childrenToRender,
    state: viewportState
  } = (0, _usePopupViewport.usePopupViewport)({
    store,
    side,
    children
  });
  const state = {
    activationDirection: viewportState.activationDirection,
    transitioning: viewportState.transitioning,
    instant: instantType
  };
  return (0, _useRenderElement.useRenderElement)('div', componentProps, {
    state,
    ref: forwardedRef,
    props: [elementProps, {
      children: childrenToRender
    }],
    stateAttributesMapping: _usePopupViewport.popupViewportStateMapping
  });
});
if (process.env.NODE_ENV !== "production") PopoverViewport.displayName = "PopoverViewport";