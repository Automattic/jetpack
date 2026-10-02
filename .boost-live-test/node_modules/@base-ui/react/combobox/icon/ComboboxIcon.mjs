'use client';

import * as React from 'react';
import { useRenderElement } from "../../internals/useRenderElement.mjs";

/**
 * An icon that indicates that the trigger button opens the popup.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export const ComboboxIcon = /*#__PURE__*/React.forwardRef(function ComboboxIcon(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    ...elementProps
  } = componentProps;
  const element = useRenderElement('span', componentProps, {
    ref: forwardedRef,
    props: [{
      'aria-hidden': true,
      children: '▼'
    }, elementProps]
  });
  return element;
});
if (process.env.NODE_ENV !== "production") ComboboxIcon.displayName = "ComboboxIcon";