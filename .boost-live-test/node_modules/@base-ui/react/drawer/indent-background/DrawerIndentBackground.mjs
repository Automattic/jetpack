'use client';

import * as React from 'react';
import { useRenderElement } from "../../internals/useRenderElement.mjs";
import { useDrawerProviderContext } from "../provider/DrawerProviderContext.mjs";
const stateAttributesMapping = {
  active(value) {
    if (value) {
      return {
        'data-active': ''
      };
    }
    return {
      'data-inactive': ''
    };
  }
};

/**
 * An element placed before `<Drawer.Indent>` to render a background layer that can be styled based on whether any drawer is open.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Drawer](https://base-ui.com/react/components/drawer)
 */
export const DrawerIndentBackground = /*#__PURE__*/React.forwardRef(function DrawerIndentBackground(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    ...elementProps
  } = componentProps;
  const providerContext = useDrawerProviderContext();
  const active = providerContext?.active ?? false;
  const state = {
    active
  };
  return useRenderElement('div', componentProps, {
    ref: forwardedRef,
    state,
    props: elementProps,
    stateAttributesMapping
  });
});
if (process.env.NODE_ENV !== "production") DrawerIndentBackground.displayName = "DrawerIndentBackground";