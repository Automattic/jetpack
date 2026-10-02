'use client';

import * as React from 'react';
import { useRenderElement } from "../../internals/useRenderElement.mjs";
import { useDialogRootContext } from "../root/DialogRootContext.mjs";
import { useDialogPortalContext } from "../portal/DialogPortalContext.mjs";
import { dialogStateAttributesMapping } from "../utils/stateAttributesMapping.mjs";

/**
 * A positioning container for the dialog popup that can be made scrollable.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 */
export const DialogViewport = /*#__PURE__*/React.forwardRef(function DialogViewport(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    children,
    ...elementProps
  } = componentProps;
  const keepMounted = useDialogPortalContext();
  const store = useDialogRootContext();
  const open = store.useState('open');
  const nested = store.useState('nested');
  const transitionStatus = store.useState('transitionStatus');
  const nestedOpenDialogCount = store.useState('nestedOpenDialogCount');
  const mounted = store.useState('mounted');
  const setViewportElement = store.useStateSetter('viewportElement');
  const nestedDialogOpen = nestedOpenDialogCount > 0;
  const state = {
    open,
    nested,
    transitionStatus,
    nestedDialogOpen
  };
  const shouldRender = keepMounted || mounted;
  return useRenderElement('div', componentProps, {
    enabled: shouldRender,
    state,
    ref: [forwardedRef, setViewportElement],
    stateAttributesMapping: dialogStateAttributesMapping,
    props: [{
      role: 'presentation',
      hidden: !mounted,
      style: {
        pointerEvents: !open ? 'none' : undefined
      },
      children
    }, elementProps]
  });
});
if (process.env.NODE_ENV !== "production") DialogViewport.displayName = "DialogViewport";