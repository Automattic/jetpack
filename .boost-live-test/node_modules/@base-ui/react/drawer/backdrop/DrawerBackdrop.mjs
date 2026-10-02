'use client';

import * as React from 'react';
import { useDialogRootContext } from "../../dialog/root/DialogRootContext.mjs";
import { useRenderElement } from "../../internals/useRenderElement.mjs";
import { popupTransitionStateMapping } from "../../utils/popupStateMapping.mjs";
import * as DrawerPopupCssVars from "../popup/DrawerPopupCssVars.mjs";
import * as DrawerBackdropCssVars from "./DrawerBackdropCssVars.mjs";

/**
 * An overlay displayed beneath the popup.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Drawer](https://base-ui.com/react/components/drawer)
 */
export const DrawerBackdrop = /*#__PURE__*/React.forwardRef(function DrawerBackdrop(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    forceRender = false,
    ...elementProps
  } = componentProps;
  const store = useDialogRootContext();
  const open = store.useState('open');
  const nested = store.useState('nested');
  const mounted = store.useState('mounted');
  const transitionStatus = store.useState('transitionStatus');
  const state = {
    open,
    transitionStatus
  };
  return useRenderElement('div', componentProps, {
    state,
    ref: [store.context.backdropRef, forwardedRef],
    stateAttributesMapping: popupTransitionStateMapping,
    props: [{
      role: 'presentation',
      hidden: !mounted,
      style: {
        pointerEvents: !open ? 'none' : undefined,
        userSelect: 'none',
        WebkitUserSelect: 'none',
        [DrawerBackdropCssVars.swipeProgress]: '0',
        [DrawerPopupCssVars.swipeStrength]: '1'
      }
    }, elementProps],
    enabled: forceRender || !nested
  });
});
if (process.env.NODE_ENV !== "production") DrawerBackdrop.displayName = "DrawerBackdrop";