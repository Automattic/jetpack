"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MeterTrack = void 0;
var React = _interopRequireWildcard(require("react"));
var _useRenderElement = require("../../internals/useRenderElement");
/**
 * Contains the meter indicator and represents the entire range of the meter.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Meter](https://base-ui.com/react/components/meter)
 */
const MeterTrack = exports.MeterTrack = /*#__PURE__*/React.forwardRef(function MeterTrack(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    ...elementProps
  } = componentProps;
  return (0, _useRenderElement.useRenderElement)('div', componentProps, {
    ref: forwardedRef,
    props: elementProps
  });
});
if (process.env.NODE_ENV !== "production") MeterTrack.displayName = "MeterTrack";