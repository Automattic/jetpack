'use client';

import * as React from 'react';
import { FloatingFocusManager } from "../../floating-ui-react/index.mjs";
import { useDialogRootContext } from "../root/DialogRootContext.mjs";
import { useRenderElement } from "../../internals/useRenderElement.mjs";
import { useDialogPortalContext } from "../portal/DialogPortalContext.mjs";
import { useOpenChangeComplete } from "../../internals/useOpenChangeComplete.mjs";
import { COMPOSITE_KEYS } from "../../internals/composite/composite.mjs";
import { FOCUSABLE_POPUP_PROPS, createDefaultInitialFocus } from "../../utils/popups/index.mjs";
import * as DialogPopupCssVars from "./DialogPopupCssVars.mjs";
import { dialogStateAttributesMapping } from "../utils/stateAttributesMapping.mjs";

/**
 * A container for the dialog contents.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 */
import { jsx as _jsx } from "react/jsx-runtime";
export const DialogPopup = /*#__PURE__*/React.forwardRef(function DialogPopup(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    finalFocus,
    initialFocus,
    ...elementProps
  } = componentProps;
  const store = useDialogRootContext();
  const descriptionElementId = store.useState('descriptionElementId');
  const disablePointerDismissal = store.useState('disablePointerDismissal');
  const floatingRootContext = store.useState('floatingRootContext');
  const rootPopupProps = store.useState('popupProps');
  const modal = store.useState('modal');
  const mounted = store.useState('mounted');
  const nested = store.useState('nested');
  const nestedOpenDialogCount = store.useState('nestedOpenDialogCount');
  const open = store.useState('open');
  const openMethod = store.useState('openMethod');
  const titleElementId = store.useState('titleElementId');
  const transitionStatus = store.useState('transitionStatus');
  const role = store.useState('role');
  const floatingId = floatingRootContext.useState('floatingId');
  useDialogPortalContext();
  useOpenChangeComplete({
    open,
    ref: store.context.popupRef,
    onComplete() {
      if (open) {
        store.context.onOpenChangeComplete?.(true);
      }
    }
  });
  const resolvedInitialFocus = initialFocus === undefined ? createDefaultInitialFocus(store.context.popupRef) : initialFocus;
  const nestedDialogOpen = nestedOpenDialogCount > 0;
  const setPopupElement = store.useStateSetter('popupElement');
  const state = {
    open,
    nested,
    transitionStatus,
    nestedDialogOpen
  };
  const element = useRenderElement('div', componentProps, {
    state,
    props: [rootPopupProps, {
      id: floatingId,
      'aria-labelledby': titleElementId,
      'aria-describedby': descriptionElementId,
      role,
      ...FOCUSABLE_POPUP_PROPS,
      hidden: !mounted,
      onKeyDown(event) {
        if (COMPOSITE_KEYS.has(event.key)) {
          event.stopPropagation();
        }
      },
      style: {
        [DialogPopupCssVars.nestedDialogs]: nestedOpenDialogCount
      }
    }, elementProps],
    ref: [forwardedRef, store.context.popupRef, setPopupElement],
    stateAttributesMapping: dialogStateAttributesMapping
  });
  return /*#__PURE__*/_jsx(FloatingFocusManager, {
    context: floatingRootContext,
    openInteractionType: openMethod,
    disabled: !mounted,
    closeOnFocusOut: !disablePointerDismissal,
    initialFocus: resolvedInitialFocus,
    returnFocus: finalFocus,
    modal: modal !== false,
    restoreFocus: "popup",
    children: element
  });
});
if (process.env.NODE_ENV !== "production") DialogPopup.displayName = "DialogPopup";