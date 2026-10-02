"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.NumberFieldGroup = void 0;
var React = _interopRequireWildcard(require("react"));
var _NumberFieldRootContext = require("../root/NumberFieldRootContext");
var _stateAttributesMapping = require("../utils/stateAttributesMapping");
var _useRenderElement = require("../../internals/useRenderElement");
/**
 * Groups the input with the increment and decrement buttons.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Number Field](https://base-ui.com/react/components/number-field)
 */
const NumberFieldGroup = exports.NumberFieldGroup = /*#__PURE__*/React.forwardRef(function NumberFieldGroup(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    ...elementProps
  } = componentProps;
  const {
    state
  } = (0, _NumberFieldRootContext.useNumberFieldRootContext)();
  const element = (0, _useRenderElement.useRenderElement)('div', componentProps, {
    ref: forwardedRef,
    state,
    props: [{
      role: 'group'
    }, elementProps],
    stateAttributesMapping: _stateAttributesMapping.stateAttributesMapping
  });
  return element;
});
if (process.env.NODE_ENV !== "production") NumberFieldGroup.displayName = "NumberFieldGroup";