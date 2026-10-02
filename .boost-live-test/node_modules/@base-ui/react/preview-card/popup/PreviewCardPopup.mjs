'use client';

import * as React from 'react';
import { usePreviewCardRootContext } from "../root/PreviewCardContext.mjs";
import { usePreviewCardPositionerContext } from "../positioner/PreviewCardPositionerContext.mjs";
import { popupTransitionStateMapping } from "../../utils/popupStateMapping.mjs";
import { useOpenChangeComplete } from "../../internals/useOpenChangeComplete.mjs";
import { useRenderElement } from "../../internals/useRenderElement.mjs";
import { getDisabledMountTransitionStyles } from "../../internals/getDisabledMountTransitionStyles.mjs";
import { useHoverFloatingInteraction } from "../../floating-ui-react/index.mjs";
import { FOCUSABLE_POPUP_PROPS } from "../../utils/popups/index.mjs";

/**
 * A container for the preview card contents.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Preview Card](https://base-ui.com/react/components/preview-card)
 */
export const PreviewCardPopup = /*#__PURE__*/React.forwardRef(function PreviewCardPopup(componentProps, forwardedRef) {
  const {
    className,
    render,
    style,
    ...elementProps
  } = componentProps;
  const store = usePreviewCardRootContext();
  const {
    side,
    align
  } = usePreviewCardPositionerContext();
  const open = store.useState('open');
  const instantType = store.useState('instantType');
  const transitionStatus = store.useState('transitionStatus');
  const popupProps = store.useState('popupProps');
  const floatingContext = store.useState('floatingRootContext');
  const closeDelay = store.useState('closeDelay');
  useOpenChangeComplete({
    open,
    ref: store.context.popupRef,
    onComplete() {
      if (open) {
        store.context.onOpenChangeComplete?.(true);
      }
    }
  });
  useHoverFloatingInteraction(floatingContext, {
    closeDelay
  });
  const state = {
    open,
    side,
    align,
    instant: instantType,
    transitionStatus
  };
  const element = useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, store.context.popupRef, store.useStateSetter('popupElement')],
    props: [FOCUSABLE_POPUP_PROPS, popupProps, getDisabledMountTransitionStyles(transitionStatus), elementProps],
    stateAttributesMapping: popupTransitionStateMapping
  });
  return element;
});
if (process.env.NODE_ENV !== "production") PreviewCardPopup.displayName = "PreviewCardPopup";