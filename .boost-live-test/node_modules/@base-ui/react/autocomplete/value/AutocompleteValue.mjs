'use client';

import * as React from 'react';
import { useComboboxInputValueContext } from "../../combobox/root/ComboboxRootContext.mjs";

/**
 * The current value of the autocomplete.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Autocomplete](https://base-ui.com/react/components/autocomplete)
 */
import { jsx as _jsx } from "react/jsx-runtime";
export function AutocompleteValue(props) {
  const {
    children
  } = props;
  const inputValue = useComboboxInputValueContext();
  let returnValue = null;
  if (typeof children === 'function') {
    returnValue = children(String(inputValue));
  } else if (children != null) {
    returnValue = children;
  } else {
    returnValue = inputValue;
  }
  return /*#__PURE__*/_jsx(React.Fragment, {
    children: returnValue
  });
}