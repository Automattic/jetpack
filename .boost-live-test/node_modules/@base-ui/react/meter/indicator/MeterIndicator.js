"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MeterIndicator = void 0;
var React = _interopRequireWildcard(require("react"));
var _MeterRootContext = require("../root/MeterRootContext");
var _useRenderElement = require("../../internals/useRenderElement");
/**
 * Visualizes the position of the value along the range.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Meter](https://base-ui.com/react/components/meter)
 */
const MeterIndicator = exports.MeterIndicator = /*#__PURE__*/React.forwardRef(function MeterIndicator(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    ...elementProps
  } = componentProps;
  const {
    percentageValue
  } = (0, _MeterRootContext.useMeterRootContext)();
  return (0, _useRenderElement.useRenderElement)('div', componentProps, {
    ref: forwardedRef,
    props: [{
      style: {
        insetInlineStart: 0,
        height: 'inherit',
        width: `${percentageValue}%`
      }
    }, elementProps]
  });
});
if (process.env.NODE_ENV !== "production") MeterIndicator.displayName = "MeterIndicator";