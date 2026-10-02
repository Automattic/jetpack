'use client';

import * as React from 'react';
import { useNumberFieldStepperButton } from "../root/useNumberFieldStepperButton.mjs";
/**
 * A stepper button that increases the field value when clicked.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Number Field](https://base-ui.com/react/components/number-field)
 */
export const NumberFieldIncrement = /*#__PURE__*/React.forwardRef(function NumberFieldIncrement(componentProps, forwardedRef) {
  return useNumberFieldStepperButton(componentProps, forwardedRef, true);
});
if (process.env.NODE_ENV !== "production") NumberFieldIncrement.displayName = "NumberFieldIncrement";