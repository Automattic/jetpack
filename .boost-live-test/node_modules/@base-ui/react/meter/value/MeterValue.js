"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MeterValue = void 0;
var React = _interopRequireWildcard(require("react"));
var _MeterRootContext = require("../root/MeterRootContext");
var _useRenderElement = require("../../internals/useRenderElement");
/**
 * A text element displaying the current value.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Meter](https://base-ui.com/react/components/meter)
 */
const MeterValue = exports.MeterValue = /*#__PURE__*/React.forwardRef(function MeterValue(componentProps, forwardedRef) {
  const {
    className,
    render,
    children,
    style,
    ...elementProps
  } = componentProps;
  const {
    value,
    formattedValue
  } = (0, _MeterRootContext.useMeterRootContext)();
  return (0, _useRenderElement.useRenderElement)('span', componentProps, {
    ref: forwardedRef,
    props: [{
      'aria-hidden': true,
      children: typeof children === 'function' ? children(formattedValue, value) : formattedValue
    }, elementProps]
  });
});
if (process.env.NODE_ENV !== "production") MeterValue.displayName = "MeterValue";