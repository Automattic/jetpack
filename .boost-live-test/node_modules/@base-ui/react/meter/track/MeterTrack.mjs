'use client';

import * as React from 'react';
import { useRenderElement } from "../../internals/useRenderElement.mjs";

/**
 * Contains the meter indicator and represents the entire range of the meter.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Meter](https://base-ui.com/react/components/meter)
 */
export const MeterTrack = /*#__PURE__*/React.forwardRef(function MeterTrack(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    ...elementProps
  } = componentProps;
  return useRenderElement('div', componentProps, {
    ref: forwardedRef,
    props: elementProps
  });
});
if (process.env.NODE_ENV !== "production") MeterTrack.displayName = "MeterTrack";