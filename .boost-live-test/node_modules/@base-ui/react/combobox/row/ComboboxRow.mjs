'use client';

import * as React from 'react';
import { useRenderElement } from "../../internals/useRenderElement.mjs";
import { ComboboxRowContext } from "./ComboboxRowContext.mjs";

/**
 * Displays a single row of items in a grid list.
 * Enable `grid` on the root component to turn the listbox into a grid.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
import { jsx as _jsx } from "react/jsx-runtime";
export const ComboboxRow = /*#__PURE__*/React.forwardRef(function ComboboxRow(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    ...elementProps
  } = componentProps;
  const element = useRenderElement('div', componentProps, {
    ref: forwardedRef,
    props: [{
      role: 'row'
    }, elementProps]
  });
  return /*#__PURE__*/_jsx(ComboboxRowContext.Provider, {
    value: true,
    children: element
  });
});
if (process.env.NODE_ENV !== "production") ComboboxRow.displayName = "ComboboxRow";