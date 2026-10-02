'use client';

import * as React from 'react';
import { useRenderElement } from "../../internals/useRenderElement.mjs";
import { ComboboxGroupContext } from "./ComboboxGroupContext.mjs";
import { GroupCollectionProvider } from "../collection/GroupCollectionContext.mjs";
import { useComboboxRootContext } from "../root/ComboboxRootContext.mjs";

/**
 * Groups related items with the corresponding label.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
import { jsx as _jsx } from "react/jsx-runtime";
export const ComboboxGroup = /*#__PURE__*/React.forwardRef(function ComboboxGroup(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    items,
    ...elementProps
  } = componentProps;
  const store = useComboboxRootContext();
  const grid = store.useState('grid');
  const [labelId, setLabelId] = React.useState();
  const contextValue = React.useMemo(() => ({
    labelId,
    setLabelId,
    items
  }), [labelId, setLabelId, items]);
  const element = useRenderElement('div', componentProps, {
    ref: forwardedRef,
    props: [{
      // `group` is not a valid owned element of `grid`, and `row` must be owned
      // by `grid`, `rowgroup`, or `treegrid`.
      role: grid ? 'rowgroup' : 'group',
      'aria-labelledby': labelId
    }, elementProps]
  });
  const wrappedElement = /*#__PURE__*/_jsx(ComboboxGroupContext.Provider, {
    value: contextValue,
    children: element
  });
  if (items) {
    return /*#__PURE__*/_jsx(GroupCollectionProvider, {
      items: items,
      children: wrappedElement
    });
  }
  return wrappedElement;
});
if (process.env.NODE_ENV !== "production") ComboboxGroup.displayName = "ComboboxGroup";