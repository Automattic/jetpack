"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ProgressValue = void 0;
var React = _interopRequireWildcard(require("react"));
var _useRenderElement = require("../../internals/useRenderElement");
var _ProgressRootContext = require("../root/ProgressRootContext");
var _stateAttributesMapping = require("../root/stateAttributesMapping");
/**
 * A text element displaying the current value.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Progress](https://base-ui.com/react/components/progress)
 */
const ProgressValue = exports.ProgressValue = /*#__PURE__*/React.forwardRef(function ProgressValue(componentProps, forwardedRef) {
  const {
    className,
    render,
    children,
    style,
    ...elementProps
  } = componentProps;
  const {
    value,
    formattedValue,
    state
  } = (0, _ProgressRootContext.useProgressRootContext)();

  // Follow `status` rather than re-deriving it: a non-finite `value` is also indeterminate, and
  // has no formatted text to show.
  const indeterminate = state.status === 'indeterminate';
  const formattedValueArg = indeterminate ? 'indeterminate' : formattedValue;
  const formattedValueDisplay = indeterminate ? null : formattedValue;
  const element = (0, _useRenderElement.useRenderElement)('span', componentProps, {
    state,
    ref: forwardedRef,
    props: [{
      'aria-hidden': true,
      children: typeof children === 'function' ? children(formattedValueArg, value) : formattedValueDisplay
    }, elementProps],
    stateAttributesMapping: _stateAttributesMapping.progressStateAttributesMapping
  });
  return element;
});
if (process.env.NODE_ENV !== "production") ProgressValue.displayName = "ProgressValue";