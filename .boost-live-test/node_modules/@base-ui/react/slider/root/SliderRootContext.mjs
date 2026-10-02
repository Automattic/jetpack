'use client';

import _formatErrorMessage from "@base-ui/utils/formatErrorMessage";
import * as React from 'react';
export const SliderRootContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") SliderRootContext.displayName = "SliderRootContext";
export function useSliderRootContext() {
  const context = React.useContext(SliderRootContext);
  if (context === undefined) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: SliderRootContext is missing. Slider parts must be placed within <Slider.Root>.' : _formatErrorMessage(62));
  }
  return context;
}