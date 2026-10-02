'use client';

import * as React from 'react';
import { useDialogRootContext } from "../root/DialogRootContext.mjs";
import { useRenderElement } from "../../internals/useRenderElement.mjs";
import { popupTransitionStateMapping } from "../../utils/popupStateMapping.mjs";

/**
 * An overlay displayed beneath the popup.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 */
export const DialogBackdrop = /*#__PURE__*/React.forwardRef(function DialogBackdrop(componentProps, forwardedRef) {
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
        userSelect: 'none',
        WebkitUserSelect: 'none'
      }
    }, elementProps],
    enabled: forceRender || !nested
  });
});
if (process.env.NODE_ENV !== "production") DialogBackdrop.displayName = "DialogBackdrop";