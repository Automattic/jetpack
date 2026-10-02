"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Input = void 0;
var React = _interopRequireWildcard(require("react"));
var _field = require("../field");
var _jsxRuntime = require("react/jsx-runtime");
/**
 * A native input element that automatically works with [Field](https://base-ui.com/react/components/field).
 * Renders an `<input>` element.
 *
 * Documentation: [Base UI Input](https://base-ui.com/react/components/input)
 */
const Input = exports.Input = /*#__PURE__*/React.forwardRef(function Input(props, forwardedRef) {
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_field.Field.Control, {
    ref: forwardedRef,
    ...props
  });
});
if (process.env.NODE_ENV !== "production") Input.displayName = "Input";