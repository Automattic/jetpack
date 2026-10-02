'use client';

import * as React from 'react';
import { useRenderElement } from "../../internals/useRenderElement.mjs";
import { useInitialLiveRegionTextMutation } from "../utils/useInitialLiveRegionTextMutation.mjs";

/**
 * Displays a status message whose content changes are announced politely to screen readers.
 * Useful for conveying the status of an asynchronously loaded list.
 * This component's root element must remain mounted in the DOM to announce
 * changes consistently across screen readers. Avoid hiding or removing the
 * component itself with `display: none`, `hidden`, `aria-hidden`, or conditional
 * rendering. Prefer updating or conditionally rendering its children instead.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export const ComboboxStatus = /*#__PURE__*/React.forwardRef(function ComboboxStatus(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    children: childrenProp,
    ...elementProps
  } = componentProps;
  const statusRef = useInitialLiveRegionTextMutation();
  return useRenderElement('div', componentProps, {
    ref: [forwardedRef, statusRef],
    props: [{
      children: childrenProp,
      role: 'status',
      'aria-live': 'polite',
      'aria-atomic': true
    }, elementProps]
  });
});
if (process.env.NODE_ENV !== "production") ComboboxStatus.displayName = "ComboboxStatus";