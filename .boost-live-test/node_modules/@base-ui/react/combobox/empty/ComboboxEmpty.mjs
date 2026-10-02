'use client';

import * as React from 'react';
import { useRenderElement } from "../../internals/useRenderElement.mjs";
import { useComboboxDerivedItemsContext, useComboboxRootContext } from "../root/ComboboxRootContext.mjs";
import { useInitialLiveRegionTextMutation } from "../utils/useInitialLiveRegionTextMutation.mjs";

/**
 * Renders its children only when the list is empty.
 * Requires the `items` prop on the root component.
 * Announces changes politely to screen readers.
 * This component's root element must remain mounted in the DOM to announce
 * changes consistently across screen readers. Avoid hiding or removing the
 * component itself with `display: none`, `hidden`, `aria-hidden`, or conditional
 * rendering. Prefer updating or conditionally rendering its children instead.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export const ComboboxEmpty = /*#__PURE__*/React.forwardRef(function ComboboxEmpty(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    children: childrenProp,
    ...elementProps
  } = componentProps;
  const {
    filteredItems
  } = useComboboxDerivedItemsContext();
  const store = useComboboxRootContext();
  const emptyRef = useInitialLiveRegionTextMutation();
  const children = filteredItems.length === 0 ? childrenProp : null;
  return useRenderElement('div', componentProps, {
    ref: [forwardedRef, store.context.emptyRef, emptyRef],
    props: [{
      children,
      role: 'status',
      'aria-live': 'polite',
      'aria-atomic': true
    }, elementProps]
  });
});
if (process.env.NODE_ENV !== "production") ComboboxEmpty.displayName = "ComboboxEmpty";