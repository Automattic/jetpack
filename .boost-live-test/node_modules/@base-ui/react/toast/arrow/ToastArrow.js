"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ToastArrow = void 0;
var React = _interopRequireWildcard(require("react"));
var _ToastPositionerContext = require("../positioner/ToastPositionerContext");
var _useRenderElement = require("../../internals/useRenderElement");
/**
 * Displays an element positioned against the toast anchor.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 */
const ToastArrow = exports.ToastArrow = /*#__PURE__*/React.forwardRef(function ToastArrow(componentProps, forwardedRef) {
  const {
    className,
    render,
    style,
    ...elementProps
  } = componentProps;
  const {
    arrowRef,
    side,
    align,
    arrowUncentered,
    arrowStyles
  } = (0, _ToastPositionerContext.useToastPositionerContext)();
  const state = {
    side,
    align,
    uncentered: arrowUncentered
  };
  return (0, _useRenderElement.useRenderElement)('div', componentProps, {
    state,
    ref: [forwardedRef, arrowRef],
    props: [{
      style: arrowStyles,
      'aria-hidden': true
    }, elementProps]
  });
});
if (process.env.NODE_ENV !== "production") ToastArrow.displayName = "ToastArrow";