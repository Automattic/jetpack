'use client';

import * as React from 'react';
import { useMeterRootContext } from "../root/MeterRootContext.mjs";
import { useRenderElement } from "../../internals/useRenderElement.mjs";

/**
 * A text element displaying the current value.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Meter](https://base-ui.com/react/components/meter)
 */
export const MeterValue = /*#__PURE__*/React.forwardRef(function MeterValue(componentProps, forwardedRef) {
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
  } = useMeterRootContext();
  return useRenderElement('span', componentProps, {
    ref: forwardedRef,
    props: [{
      'aria-hidden': true,
      children: typeof children === 'function' ? children(formattedValue, value) : formattedValue
    }, elementProps]
  });
});
if (process.env.NODE_ENV !== "production") MeterValue.displayName = "MeterValue";