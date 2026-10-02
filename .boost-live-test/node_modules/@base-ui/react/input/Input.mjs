'use client';

import * as React from 'react';
import { Field } from "../field/index.mjs";

/**
 * A native input element that automatically works with [Field](https://base-ui.com/react/components/field).
 * Renders an `<input>` element.
 *
 * Documentation: [Base UI Input](https://base-ui.com/react/components/input)
 */
import { jsx as _jsx } from "react/jsx-runtime";
export const Input = /*#__PURE__*/React.forwardRef(function Input(props, forwardedRef) {
  return /*#__PURE__*/_jsx(Field.Control, {
    ref: forwardedRef,
    ...props
  });
});
if (process.env.NODE_ENV !== "production") Input.displayName = "Input";