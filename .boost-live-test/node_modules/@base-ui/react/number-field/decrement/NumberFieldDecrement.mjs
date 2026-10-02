'use client';

import * as React from 'react';
import { useNumberFieldStepperButton } from "../root/useNumberFieldStepperButton.mjs";
/**
 * A stepper button that decreases the field value when clicked.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Number Field](https://base-ui.com/react/components/number-field)
 */
export const NumberFieldDecrement = /*#__PURE__*/React.forwardRef(function NumberFieldDecrement(componentProps, forwardedRef) {
  return useNumberFieldStepperButton(componentProps, forwardedRef, false);
});
if (process.env.NODE_ENV !== "production") NumberFieldDecrement.displayName = "NumberFieldDecrement";