"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ProgressRoot = void 0;
var React = _interopRequireWildcard(require("react"));
var _visuallyHidden = require("@base-ui/utils/visuallyHidden");
var _formatNumber = require("@base-ui/utils/formatNumber");
var _clamp = require("@base-ui/utils/clamp");
var _valueToPercent = require("../../utils/valueToPercent");
var _useRenderElement = require("../../internals/useRenderElement");
var _ProgressRootContext = require("./ProgressRootContext");
var _stateAttributesMapping = require("./stateAttributesMapping");
var _jsxRuntime = require("react/jsx-runtime");
/**
 * Groups all parts of the progress bar and provides the task completion status to screen readers.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Progress](https://base-ui.com/react/components/progress)
 */
const ProgressRoot = exports.ProgressRoot = /*#__PURE__*/React.forwardRef(function ProgressRoot(componentProps, forwardedRef) {
  const {
    format,
    getAriaValueText,
    locale,
    max = 100,
    min = 0,
    value,
    render,
    className,
    children,
    style,
    ...elementProps
  } = componentProps;
  const [labelId, setLabelId] = React.useState();

  // `value === null` (or any non-finite value) keeps Progress indeterminate. Otherwise compute a
  // single clamped value and normalized percentage so completion status, `aria-valuenow`, the
  // formatted text, the default `aria-valuetext`, and the indicator width all stay in sync for any
  // `min`/`max` (not just the default 0–100).
  let status = 'indeterminate';
  let percentageValue = null;
  let clampedValue = null;
  let formattedValue = '';
  // Derived alongside `status` so the indeterminate condition is not restated anywhere else.
  let defaultAriaValueText = 'indeterminate progress';
  if (value != null && Number.isFinite(value)) {
    const rawPercentage = (0, _valueToPercent.valueToPercent)(value, min, max);
    percentageValue = (0, _clamp.clamp)(Number.isNaN(rawPercentage) ? 0 : rawPercentage, 0, 100);
    clampedValue = (0, _clamp.clamp)(value, min, max);
    status = clampedValue === max ? 'complete' : 'progressing';
    // Format the clamped value so visible and accessible text stay in sync with `aria-valuenow` and
    // the indicator fill. The raw value remains available as the second `getAriaValueText` argument.
    formattedValue = format ? (0, _formatNumber.formatNumber)(clampedValue, locale, format) : (0, _formatNumber.formatNumber)(percentageValue / 100, locale, {
      style: 'percent'
    });
    defaultAriaValueText = formattedValue;
  }
  const state = React.useMemo(() => ({
    status
  }), [status]);
  const defaultProps = {
    'aria-labelledby': labelId,
    'aria-valuemax': max,
    'aria-valuemin': min,
    'aria-valuenow': clampedValue ?? undefined,
    'aria-valuetext': getAriaValueText ? getAriaValueText(formattedValue, value) : defaultAriaValueText,
    role: 'progressbar',
    children: /*#__PURE__*/(0, _jsxRuntime.jsxs)(React.Fragment, {
      children: [children, /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
        role: "presentation",
        style: _visuallyHidden.visuallyHidden,
        children: "x"
      })]
    })
  };
  const contextValue = React.useMemo(() => ({
    formattedValue,
    percentageValue,
    setLabelId,
    state,
    value
  }), [formattedValue, percentageValue, setLabelId, state, value]);
  const element = (0, _useRenderElement.useRenderElement)('div', componentProps, {
    state,
    ref: forwardedRef,
    props: [defaultProps, elementProps],
    stateAttributesMapping: _stateAttributesMapping.progressStateAttributesMapping
  });
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_ProgressRootContext.ProgressRootContext.Provider, {
    value: contextValue,
    children: element
  });
});
if (process.env.NODE_ENV !== "production") ProgressRoot.displayName = "ProgressRoot";