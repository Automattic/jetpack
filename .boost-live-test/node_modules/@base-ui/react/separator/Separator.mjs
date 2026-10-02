'use client';

import * as React from 'react';
import { useRenderElement } from "../internals/useRenderElement.mjs";

/**
 * A separator element accessible to screen readers.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Separator](https://base-ui.com/react/components/separator)
 */
export const Separator = /*#__PURE__*/React.forwardRef(function SeparatorComponent(componentProps, forwardedRef) {
  const {
    className,
    render,
    orientation = 'horizontal',
    style,
    ...elementProps
  } = componentProps;
  const state = {
    orientation
  };
  const element = useRenderElement('div', componentProps, {
    state,
    ref: forwardedRef,
    props: [{
      role: 'separator',
      'aria-orientation': orientation
    }, elementProps]
  });
  return element;
});
if (process.env.NODE_ENV !== "production") Separator.displayName = "Separator";