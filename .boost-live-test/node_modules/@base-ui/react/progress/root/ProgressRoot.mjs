'use client';

import * as React from 'react';
import { visuallyHidden } from '@base-ui/utils/visuallyHidden';
import { formatNumber } from '@base-ui/utils/formatNumber';
import { clamp } from '@base-ui/utils/clamp';
import { valueToPercent } from "../../utils/valueToPercent.mjs";
import { useRenderElement } from "../../internals/useRenderElement.mjs";
import { ProgressRootContext } from "./ProgressRootContext.mjs";
import { progressStateAttributesMapping } from "./stateAttributesMapping.mjs";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Groups all parts of the progress bar and provides the task completion status to screen readers.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Progress](https://base-ui.com/react/components/progress)
 */
export const ProgressRoot = /*#__PURE__*/React.forwardRef(function ProgressRoot(componentProps, forwardedRef) {
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
    const rawPercentage = valueToPercent(value, min, max);
    percentageValue = clamp(Number.isNaN(rawPercentage) ? 0 : rawPercentage, 0, 100);
    clampedValue = clamp(value, min, max);
    status = clampedValue === max ? 'complete' : 'progressing';
    // Format the clamped value so visible and accessible text stay in sync with `aria-valuenow` and
    // the indicator fill. The raw value remains available as the second `getAriaValueText` argument.
    formattedValue = format ? formatNumber(clampedValue, locale, format) : formatNumber(percentageValue / 100, locale, {
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
    children: /*#__PURE__*/_jsxs(React.Fragment, {
      children: [children, /*#__PURE__*/_jsx("span", {
        role: "presentation",
        style: visuallyHidden,
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
  const element = useRenderElement('div', componentProps, {
    state,
    ref: forwardedRef,
    props: [defaultProps, elementProps],
    stateAttributesMapping: progressStateAttributesMapping
  });
  return /*#__PURE__*/_jsx(ProgressRootContext.Provider, {
    value: contextValue,
    children: element
  });
});
if (process.env.NODE_ENV !== "production") ProgressRoot.displayName = "ProgressRoot";