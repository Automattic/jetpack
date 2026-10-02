'use client';

import * as React from 'react';
import { useRenderElement } from "../../internals/useRenderElement.mjs";

/**
 * A visual separator between items.
 * Renders a `<div>` element.
 *
 * @internal
 */
export const ListboxSeparator = /*#__PURE__*/React.forwardRef(function ListboxSeparator(componentProps, forwardedRef) {
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
  return useRenderElement('div', componentProps, {
    state,
    ref: forwardedRef,
    props: [{
      role: 'presentation'
    }, elementProps]
  });
});
if (process.env.NODE_ENV !== "production") ListboxSeparator.displayName = "ListboxSeparator";