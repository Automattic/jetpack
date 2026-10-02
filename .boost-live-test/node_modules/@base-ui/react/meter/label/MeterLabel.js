"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MeterLabel = void 0;
var React = _interopRequireWildcard(require("react"));
var _MeterRootContext = require("../root/MeterRootContext");
var _useRenderElement = require("../../internals/useRenderElement");
var _useRegisteredLabelId = require("../../utils/useRegisteredLabelId");
/**
 * An accessible label for the meter.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Meter](https://base-ui.com/react/components/meter)
 */
const MeterLabel = exports.MeterLabel = /*#__PURE__*/React.forwardRef(function MeterLabel(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    id: idProp,
    ...elementProps
  } = componentProps;
  const {
    setLabelId
  } = (0, _MeterRootContext.useMeterRootContext)();
  const id = (0, _useRegisteredLabelId.useRegisteredLabelId)(idProp, setLabelId);
  return (0, _useRenderElement.useRenderElement)('span', componentProps, {
    ref: forwardedRef,
    props: [{
      id,
      role: 'presentation'
    }, elementProps]
  });
});
if (process.env.NODE_ENV !== "production") MeterLabel.displayName = "MeterLabel";