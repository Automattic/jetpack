'use client';

import * as React from 'react';
import { useComboboxRootContext } from "../root/ComboboxRootContext.mjs";
import { resolveMultipleLabels, resolveSelectedLabel } from "../../internals/resolveValueLabel.mjs";

/**
 * The current value of the combobox.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
import { jsx as _jsx } from "react/jsx-runtime";
export function ComboboxValue(props) {
  const {
    children: childrenProp,
    placeholder
  } = props;
  const store = useComboboxRootContext();
  const itemToStringLabel = store.useState('itemToStringLabel');
  const selectedValue = store.useState('selectedValue');
  const items = store.useState('items');
  const multiple = store.useState('selectionMode') === 'multiple';
  const hasSelectedValue = store.useState('hasSelectedValue');
  const shouldCheckNullItemLabel = !hasSelectedValue && placeholder != null && childrenProp == null;
  const hasNullLabel = store.useState('hasNullItemLabel', shouldCheckNullItemLabel);
  let children = null;
  if (typeof childrenProp === 'function') {
    children = childrenProp(selectedValue);
  } else if (childrenProp != null) {
    children = childrenProp;
  } else if (!hasSelectedValue && placeholder != null && !hasNullLabel) {
    children = placeholder;
  } else if (multiple && Array.isArray(selectedValue)) {
    children = resolveMultipleLabels(selectedValue, items, itemToStringLabel);
  } else {
    children = resolveSelectedLabel(selectedValue, items, itemToStringLabel);
  }
  return /*#__PURE__*/_jsx(React.Fragment, {
    children: children
  });
}