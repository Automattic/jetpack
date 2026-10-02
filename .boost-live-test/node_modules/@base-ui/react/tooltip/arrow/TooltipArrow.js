"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TooltipArrow = void 0;
var React = _interopRequireWildcard(require("react"));
var _TooltipPositionerContext = require("../positioner/TooltipPositionerContext");
var _popupStateMapping = require("../../utils/popupStateMapping");
var _useRenderElement = require("../../internals/useRenderElement");
var _TooltipRootContext = require("../root/TooltipRootContext");
/**
 * Displays an element positioned against the tooltip anchor.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Tooltip](https://base-ui.com/react/components/tooltip)
 */
const TooltipArrow = exports.TooltipArrow = /*#__PURE__*/React.forwardRef(function TooltipArrow(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    ...elementProps
  } = componentProps;
  const store = (0, _TooltipRootContext.useTooltipRootContext)();
  const {
    arrowRef,
    side,
    align,
    arrowUncentered,
    arrowStyles
  } = (0, _TooltipPositionerContext.useTooltipPositionerContext)();
  const open = store.useState('open');
  const instantType = store.useState('instantType');
  const state = {
    open,
    side,
    align,
    uncentered: arrowUncentered,
    instant: instantType
  };
  const element = (0, _useRenderElement.useRenderElement)('div', componentProps, {
    state,
    ref: [forwardedRef, arrowRef],
    props: [{
      style: arrowStyles,
      'aria-hidden': true
    }, elementProps],
    stateAttributesMapping: _popupStateMapping.popupStateMapping
  });
  return element;
});
if (process.env.NODE_ENV !== "production") TooltipArrow.displayName = "TooltipArrow";