'use client';

import * as React from 'react';
import { useMeterRootContext } from "../root/MeterRootContext.mjs";
import { useRenderElement } from "../../internals/useRenderElement.mjs";

/**
 * Visualizes the position of the value along the range.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Meter](https://base-ui.com/react/components/meter)
 */
export const MeterIndicator = /*#__PURE__*/React.forwardRef(function MeterIndicator(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    ...elementProps
  } = componentProps;
  const {
    percentageValue
  } = useMeterRootContext();
  return useRenderElement('div', componentProps, {
    ref: forwardedRef,
    props: [{
      style: {
        insetInlineStart: 0,
        height: 'inherit',
        width: `${percentageValue}%`
      }
    }, elementProps]
  });
});
if (process.env.NODE_ENV !== "production") MeterIndicator.displayName = "MeterIndicator";