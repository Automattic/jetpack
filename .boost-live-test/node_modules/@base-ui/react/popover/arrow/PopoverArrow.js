"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PopoverArrow = void 0;
var React = _interopRequireWildcard(require("react"));
var _PopoverPositionerContext = require("../positioner/PopoverPositionerContext");
var _PopoverRootContext = require("../root/PopoverRootContext");
var _popupStateMapping = require("../../utils/popupStateMapping");
var _useRenderElement = require("../../internals/useRenderElement");
/**
 * Displays an element positioned against the popover anchor.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
 */
const PopoverArrow = exports.PopoverArrow = /*#__PURE__*/React.forwardRef(function PopoverArrow(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    ...elementProps
  } = componentProps;
  const store = (0, _PopoverRootContext.usePopoverRootContext)();
  const open = store.useState('open');
  const {
    arrowRef,
    side,
    align,
    arrowUncentered,
    arrowStyles
  } = (0, _PopoverPositionerContext.usePopoverPositionerContext)();
  const state = {
    open,
    side,
    align,
    uncentered: arrowUncentered
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
if (process.env.NODE_ENV !== "production") PopoverArrow.displayName = "PopoverArrow";