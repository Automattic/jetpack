'use client';

import * as React from 'react';
import { useDialogRootContext } from "../../dialog/root/DialogRootContext.mjs";
import { useRenderElement } from "../../internals/useRenderElement.mjs";
import { DRAWER_CONTENT_ATTRIBUTE } from "./drawerContentAttribute.mjs";

/**
 * A container for the drawer contents.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Drawer](https://base-ui.com/react/components/drawer)
 */
export const DrawerContent = /*#__PURE__*/React.forwardRef(function DrawerContent(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    ...elementProps
  } = componentProps;
  useDialogRootContext();
  return useRenderElement('div', componentProps, {
    ref: forwardedRef,
    props: [{
      [DRAWER_CONTENT_ATTRIBUTE]: ''
    }, elementProps]
  });
});
if (process.env.NODE_ENV !== "production") DrawerContent.displayName = "DrawerContent";