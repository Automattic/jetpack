'use client';

import * as React from 'react';
import { visuallyHidden } from '@base-ui/utils/visuallyHidden';
import { formatNumber } from '@base-ui/utils/formatNumber';
import { clamp } from '@base-ui/utils/clamp';
import { MeterRootContext } from "./MeterRootContext.mjs";
import { valueToPercent } from "../../utils/valueToPercent.mjs";
import { useRenderElement } from "../../internals/useRenderElement.mjs";

/**
 * Groups all parts of the meter and provides the value for screen readers.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Meter](https://base-ui.com/react/components/meter)
 */
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const MeterRoot = /*#__PURE__*/React.forwardRef(function MeterRoot(componentProps, forwardedRef) {
  const {
    format,
    getAriaValueText,
    locale,
    max = 100,
    min = 0,
    value: valueProp,
    render,
    className,
    children,
    style,
    ...elementProps
  } = componentProps;
  const [labelId, setLabelId] = React.useState();

  // `clamp` handles infinity, but NaN needs an explicit fallback before normalizing range outputs.
  const rawPercentage = valueToPercent(valueProp, min, max);
  const percentageValue = clamp(Number.isNaN(rawPercentage) ? 0 : rawPercentage, 0, 100);
  const clampedValue = clamp(Number.isNaN(valueProp) ? min : valueProp, min, max);

  // Format the clamped value so visible and accessible text stay in sync with `aria-valuenow` and
  // the indicator fill. The raw value remains available as the second `getAriaValueText` argument.
  const formattedValue = format ? formatNumber(clampedValue, locale, format) : formatNumber(percentageValue / 100, locale, {
    style: 'percent'
  });
  let ariaValuetext = formattedValue;
  if (getAriaValueText) {
    ariaValuetext = getAriaValueText(formattedValue, valueProp);
  }
  const defaultProps = {
    'aria-labelledby': labelId,
    'aria-valuemax': max,
    'aria-valuemin': min,
    'aria-valuenow': clampedValue,
    'aria-valuetext': ariaValuetext,
    role: 'meter',
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
    value: valueProp
  }), [formattedValue, percentageValue, setLabelId, valueProp]);
  const element = useRenderElement('div', componentProps, {
    ref: forwardedRef,
    props: [defaultProps, elementProps]
  });
  return /*#__PURE__*/_jsx(MeterRootContext.Provider, {
    value: contextValue,
    children: element
  });
});
if (process.env.NODE_ENV !== "production") MeterRoot.displayName = "MeterRoot";