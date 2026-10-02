'use client';

import * as React from 'react';
import { fastComponent } from '@base-ui/utils/fastHooks';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useDismiss, FloatingTree } from "../../floating-ui-react/index.mjs";
import { PreviewCardRootContext, usePreviewCardRootContext } from "./PreviewCardContext.mjs";
import { createChangeEventDetails } from "../../internals/createBaseUIEventDetails.mjs";
import { REASONS } from "../../internals/reasons.mjs";
import { PreviewCardStore } from "../store/PreviewCardStore.mjs";
import { PopupHandleAttachment, useImplicitActiveTrigger, usePopupRootStore, useOpenStateTransitions, usePopupInteractionProps } from "../../utils/popups/index.mjs";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
function PreviewCardRootComponent(props) {
  const {
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    onOpenChangeComplete,
    actionsRef,
    handle,
    triggerId: triggerIdProp,
    defaultTriggerId: defaultTriggerIdProp = null,
    children
  } = props;
  const store = usePopupRootStore((floatingId, nested) => new PreviewCardStore({
    open: defaultOpen,
    openProp,
    activeTriggerId: defaultTriggerIdProp,
    triggerIdProp
  }, floatingId, nested));
  store.useControlledProp('openProp', openProp);
  store.useControlledProp('triggerIdProp', triggerIdProp);
  store.useContextCallback('onOpenChange', onOpenChange);
  store.useContextCallback('onOpenChangeComplete', onOpenChangeComplete);
  const open = store.useState('open');
  const activeTriggerId = store.useState('activeTriggerId');
  const mounted = store.useState('mounted');
  const payload = store.useState('payload');
  useImplicitActiveTrigger(store, {
    closeOnActiveTriggerUnmount: true
  });
  const {
    forceUnmount
  } = useOpenStateTransitions(open, store, () => {
    store.context.inlineRectCoordsRef.current = undefined;
  });
  useIsoLayoutEffect(() => {
    if (open) {
      if (activeTriggerId == null) {
        store.set('payload', undefined);
      }
    }
  }, [store, activeTriggerId, open]);
  React.useImperativeHandle(actionsRef, () => ({
    unmount: forceUnmount,
    close: () => store.setOpen(false, createChangeEventDetails(REASONS.imperativeAction))
  }), [forceUnmount, store]);
  const shouldRenderInteractions = open || mounted;
  return /*#__PURE__*/_jsxs(PreviewCardRootContext.Provider, {
    value: store,
    children: [handle && /*#__PURE__*/_jsx(PopupHandleAttachment, {
      handle: handle,
      store: store
    }), shouldRenderInteractions && /*#__PURE__*/_jsx(PreviewCardInteractions, {
      store: store
    }), typeof children === 'function' ? children({
      payload
    }) : children]
  });
}
function PreviewCardInteractions({
  store
}) {
  const floatingRootContext = store.useState('floatingRootContext');
  const dismiss = useDismiss(floatingRootContext);

  // `useDismiss` is not given an `enabled` option, so all three prop bags are always defined.
  // `dismiss.trigger` is the same object as `dismiss.reference`.
  usePopupInteractionProps(store, {
    activeTriggerProps: dismiss.reference,
    inactiveTriggerProps: dismiss.trigger,
    popupProps: dismiss.floating
  });
  return null;
}

/**
 * Groups all parts of the preview card.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Preview Card](https://base-ui.com/react/components/preview-card)
 */
export const PreviewCardRoot = fastComponent(function PreviewCardRoot(props) {
  if (usePreviewCardRootContext(true)) {
    return /*#__PURE__*/_jsx(PreviewCardRootComponent, {
      ...props
    });
  }
  return /*#__PURE__*/_jsx(FloatingTree, {
    children: /*#__PURE__*/_jsx(PreviewCardRootComponent, {
      ...props
    })
  });
});
if (process.env.NODE_ENV !== "production") PreviewCardRoot.displayName = "PreviewCardRoot";