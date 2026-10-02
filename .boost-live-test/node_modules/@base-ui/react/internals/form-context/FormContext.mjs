'use client';

import * as React from 'react';
import { NOOP } from "../noop.mjs";
export const FormContext = /*#__PURE__*/React.createContext({
  elementRef: {
    current: null
  },
  formRef: {
    current: {
      fields: new Map()
    }
  },
  errors: {},
  clearErrors: NOOP,
  validationMode: 'onSubmit',
  submitCountRef: {
    current: 0
  }
});
if (process.env.NODE_ENV !== "production") FormContext.displayName = "FormContext";
export function useFormContext() {
  return React.useContext(FormContext);
}