"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TooltipViewport = void 0;
var React = _interopRequireWildcard(require("react"));
var _TooltipRootContext = require("../root/TooltipRootContext");
var _TooltipPositionerContext = require("../positioner/TooltipPositionerContext");
var _useRenderElement = require("../../internals/useRenderElement");
var _usePopupViewport = require("../../utils/usePopupViewport");
/**
 * A viewport for displaying content transitions.
 * This component is only required if one popup can be opened by multiple triggers, its content
 * changes based on the trigger, and switching between them is animated.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Tooltip](https://base-ui.com/react/components/tooltip)
 */
const TooltipViewport = exports.TooltipViewport = /*#__PURE__*/React.forwardRef(function TooltipViewport(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    children,
    ...elementProps
  } = componentProps;
  const store = (0, _TooltipRootContext.useTooltipRootContext)();
  const positioner = (0, _TooltipPositionerContext.useTooltipPositionerContext)();
  const instantType = store.useState('instantType');
  const {
    children: childrenToRender,
    state: viewportState
  } = (0, _usePopupViewport.usePopupViewport)({
    store,
    side: positioner.side,
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
if (process.env.NODE_ENV !== "production") TooltipViewport.displayName = "TooltipViewport";