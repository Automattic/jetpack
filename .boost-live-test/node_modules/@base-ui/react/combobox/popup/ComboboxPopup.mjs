'use client';

import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { FloatingFocusManager } from "../../floating-ui-react/index.mjs";
import { useRenderElement } from "../../internals/useRenderElement.mjs";
import { useComboboxFloatingContext, useComboboxRootContext } from "../root/ComboboxRootContext.mjs";
import { popupStateMapping } from "../../utils/popupStateMapping.mjs";
import { useComboboxPositionerContext } from "../positioner/ComboboxPositionerContext.mjs";
import { useOpenChangeComplete } from "../../internals/useOpenChangeComplete.mjs";
import { transitionStatusMapping } from "../../internals/stateAttributesMapping.mjs";
import { contains, getTarget } from "../../floating-ui-react/utils.mjs";
import { getDisabledMountTransitionStyles } from "../../internals/getDisabledMountTransitionStyles.mjs";
import { ComboboxInternalDismissButton } from "../utils/ComboboxInternalDismissButton.mjs";
import { getComboboxPopupId } from "../root/utils/index.mjs";
import { useListEmpty } from "../utils/parts.mjs";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const stateAttributesMapping = {
  ...popupStateMapping,
  ...transitionStatusMapping
};

/**
 * A container for the list.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export const ComboboxPopup = /*#__PURE__*/React.forwardRef(function ComboboxPopup(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    initialFocus,
    finalFocus,
    ...elementProps
  } = componentProps;
  const store = useComboboxRootContext();
  const positioning = useComboboxPositionerContext();
  const floatingRootContext = useComboboxFloatingContext();
  const mounted = store.useState('mounted');
  const open = store.useState('open');
  const openMethod = store.useState('openMethod');
  const popupProps = store.useState('popupProps');
  const transitionStatus = store.useState('transitionStatus');
  const inputInsidePopup = store.useState('inputInsidePopup');
  const inputElement = store.useState('inputElement');
  const modal = store.useState('modal');
  const rootId = store.useState('id');
  const empty = useListEmpty();
  const popupId = elementProps.id ?? (inputInsidePopup ? getComboboxPopupId(rootId) : undefined);
  useIsoLayoutEffect(() => {
    // Prefer the rendered DOM id, which a `render` prop element or function may override.
    store.set('popupId', store.context.popupRef.current?.id || popupId);
    return () => {
      store.set('popupId', undefined);
    };
  }, [store, popupId]);
  useOpenChangeComplete({
    open,
    ref: store.context.popupRef,
    onComplete() {
      if (open) {
        store.context.onOpenChangeComplete(true);
      }
    }
  });
  const state = {
    open,
    side: positioning.side,
    align: positioning.align,
    anchorHidden: positioning.anchorHidden,
    transitionStatus,
    empty
  };
  const element = useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, store.context.popupRef],
    props: [popupProps, {
      id: popupId,
      role: inputInsidePopup ? 'dialog' : 'presentation',
      onFocus(event) {
        const target = getTarget(event.nativeEvent);
        if (openMethod !== 'touch' && (contains(store.state.listElement, target) || target === event.currentTarget)) {
          store.context.inputRef.current?.focus();
        }
      }
    }, getDisabledMountTransitionStyles(transitionStatus), elementProps],
    stateAttributesMapping
  });

  // Default initial focus logic:
  // If opened by touch, focus the popup element to prevent the virtual keyboard from opening
  // (this is required for Android specifically as iOS handles this automatically).
  const computedDefaultInitialFocus = inputInsidePopup ? interactionType => interactionType === 'touch' ? store.context.popupRef.current : inputElement : false;
  const resolvedInitialFocus = initialFocus === undefined ? computedDefaultInitialFocus : initialFocus;
  let resolvedFinalFocus;
  if (finalFocus != null) {
    resolvedFinalFocus = finalFocus;
  } else {
    resolvedFinalFocus = inputInsidePopup ? undefined : false;
  }
  const focusManagerModal = !inputInsidePopup || modal;
  return /*#__PURE__*/_jsx(FloatingFocusManager, {
    context: floatingRootContext,
    disabled: !mounted,
    modal: focusManagerModal,
    openInteractionType: openMethod,
    initialFocus: resolvedInitialFocus,
    returnFocus: resolvedFinalFocus,
    getInsideElements: () => [store.context.startDismissRef.current, store.context.endDismissRef.current],
    children: /*#__PURE__*/_jsxs(React.Fragment, {
      children: [element, focusManagerModal && /*#__PURE__*/_jsx(ComboboxInternalDismissButton, {
        ref: store.context.endDismissRef
      })]
    })
  });
});
if (process.env.NODE_ENV !== "production") ComboboxPopup.displayName = "ComboboxPopup";