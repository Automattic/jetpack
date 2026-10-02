'use client';

import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useRenderElement } from "../../internals/useRenderElement.mjs";
import { useDrawerProviderContext } from "../provider/DrawerProviderContext.mjs";
import * as DrawerBackdropCssVars from "../backdrop/DrawerBackdropCssVars.mjs";
import * as DrawerPopupCssVars from "../popup/DrawerPopupCssVars.mjs";
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
 * A wrapper element intended to contain your app's main UI.
 * Applies `data-active` when any drawer within the nearest `<Drawer.Provider>` is open.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Drawer](https://base-ui.com/react/components/drawer)
 */
export const DrawerIndent = /*#__PURE__*/React.forwardRef(function DrawerIndent(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    ...elementProps
  } = componentProps;
  const providerContext = useDrawerProviderContext();
  const active = providerContext?.active ?? false;
  const visualStateStore = providerContext?.visualStateStore;
  const indentRef = React.useRef(null);
  useIsoLayoutEffect(() => {
    const element = indentRef.current;
    if (!element || !visualStateStore) {
      return undefined;
    }
    const syncVisualState = () => {
      const {
        swipeProgress,
        frontmostHeight
      } = visualStateStore.getSnapshot();
      if (swipeProgress <= 0) {
        element.style.setProperty(DrawerBackdropCssVars.swipeProgress, '0');
      } else {
        element.style.setProperty(DrawerBackdropCssVars.swipeProgress, `${swipeProgress}`);
      }
      if (frontmostHeight <= 0) {
        element.style.removeProperty(DrawerPopupCssVars.height);
      } else {
        element.style.setProperty(DrawerPopupCssVars.height, `${frontmostHeight}px`);
      }
    };
    syncVisualState();
    const unsubscribe = visualStateStore.subscribe(syncVisualState);
    return () => {
      unsubscribe();
      element.style.setProperty(DrawerBackdropCssVars.swipeProgress, '0');
      element.style.removeProperty(DrawerPopupCssVars.height);
    };
  }, [visualStateStore]);
  const state = {
    active
  };
  return useRenderElement('div', componentProps, {
    ref: [forwardedRef, indentRef],
    state,
    props: [{
      style: {
        [DrawerBackdropCssVars.swipeProgress]: '0'
      }
    }, elementProps],
    stateAttributesMapping
  });
});
if (process.env.NODE_ENV !== "production") DrawerIndent.displayName = "DrawerIndent";