"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.NumberFieldDecrement = void 0;
var React = _interopRequireWildcard(require("react"));
var _useNumberFieldStepperButton = require("../root/useNumberFieldStepperButton");
/**
 * A stepper button that decreases the field value when clicked.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Number Field](https://base-ui.com/react/components/number-field)
 */
const NumberFieldDecrement = exports.NumberFieldDecrement = /*#__PURE__*/React.forwardRef(function NumberFieldDecrement(componentProps, forwardedRef) {
  return (0, _useNumberFieldStepperButton.useNumberFieldStepperButton)(componentProps, forwardedRef, false);
});
if (process.env.NODE_ENV !== "production") NumberFieldDecrement.displayName = "NumberFieldDecrement";