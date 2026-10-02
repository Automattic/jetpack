'use client';

import _formatErrorMessage from "@base-ui/utils/formatErrorMessage";
import * as React from 'react';
import { fastComponentRef } from '@base-ui/utils/fastHooks';
import { usePopoverRootContext } from "../root/PopoverRootContext.mjs";
import { useButton } from "../../internals/use-button/useButton.mjs";
import { triggerOpenStateMapping, pressableTriggerOpenStateMapping } from "../../utils/popupStateMapping.mjs";
import { useRenderElement } from "../../internals/useRenderElement.mjs";
import { CLICK_TRIGGER_IDENTIFIER } from "../../internals/constants.mjs";
import { safePolygon, useClick, useHoverReferenceInteraction } from "../../floating-ui-react/index.mjs";
import { OPEN_DELAY } from "../utils/constants.mjs";
import { useBaseUiId } from "../../internals/useBaseUiId.mjs";
import { FocusGuard } from "../../utils/FocusGuard.mjs";
import { REASONS } from "../../internals/reasons.mjs";
import { usePopupHandleStore, useTriggerDataForwarding } from "../../utils/popups/index.mjs";
import { useTriggerFocusGuards } from "../../utils/popups/useTriggerFocusGuards.mjs";
import { useOpenMethodTriggerProps } from "../../utils/useOpenInteractionType.mjs";

/**
 * A button that opens the popover.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
 */
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const PopoverTrigger = fastComponentRef(function PopoverTrigger(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    disabled = false,
    nativeButton = true,
    handle,
    payload,
    openOnHover = false,
    delay = OPEN_DELAY,
    closeDelay = 0,
    id: idProp,
    ...elementProps
  } = componentProps;
  const rootStore = usePopoverRootContext(true);
  const handleStore = usePopupHandleStore(handle);
  const store = handleStore ?? rootStore;
  if (!store) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: <Popover.Trigger> must be either used within a <Popover.Root> component or provided with a handle.' : _formatErrorMessage(74));
  }
  const thisTriggerId = useBaseUiId(idProp);
  const isTriggerActive = store.useState('isTriggerActive', thisTriggerId);
  const floatingContext = store.useState('floatingRootContext');
  const isOpenedByThisTrigger = store.useState('isOpenedByTrigger', thisTriggerId);
  const popupId = store.useState('triggerPopupId', thisTriggerId);
  const triggerElementRef = React.useRef(null);
  const {
    registerTrigger,
    isMountedByThisTrigger
  } = useTriggerDataForwarding(thisTriggerId, triggerElementRef, store, {
    payload,
    disabled,
    openOnHover,
    closeDelay
  });
  const openReason = store.useState('openChangeReason');
  const stickIfOpen = store.useState('stickIfOpen');
  const openMethod = store.useState('openMethod');
  const focusManagerModal = store.useState('focusManagerModal');
  const hoverProps = useHoverReferenceInteraction(floatingContext, {
    enabled: !disabled && openOnHover && (openMethod !== 'touch' || openReason !== REASONS.triggerPress),
    mouseOnly: true,
    move: false,
    handleClose: safePolygon(),
    restMs: delay,
    delay: {
      close: closeDelay
    },
    triggerElementRef,
    isActiveTrigger: isTriggerActive,
    isClosing: () => store.select('transitionStatus') === 'ending'
  });
  const click = useClick(floatingContext, {
    stickIfOpen
  });
  const interactionTypeProps = useOpenMethodTriggerProps(() => store.select('open'), interactionType => {
    store.set('openMethod', interactionType);
  });
  const rootTriggerProps = store.useState('triggerProps', isMountedByThisTrigger);
  const {
    getButtonProps,
    buttonRef
  } = useButton({
    disabled,
    native: nativeButton
  });
  const stateAttributesMapping = {
    open(value) {
      if (value && openReason === REASONS.triggerPress) {
        return pressableTriggerOpenStateMapping.open(value);
      }
      return triggerOpenStateMapping.open(value);
    }
  };
  const {
    preFocusGuardRef,
    handlePreFocusGuardFocus,
    handleFocusTargetFocus
  } = useTriggerFocusGuards(store, triggerElementRef);
  const state = {
    disabled,
    open: isOpenedByThisTrigger
  };
  const element = useRenderElement('button', componentProps, {
    state,
    ref: [buttonRef, forwardedRef, registerTrigger, triggerElementRef],
    props: [click.reference, hoverProps, rootTriggerProps, interactionTypeProps, {
      [CLICK_TRIGGER_IDENTIFIER]: '',
      id: thisTriggerId,
      'aria-haspopup': 'dialog',
      'aria-expanded': isOpenedByThisTrigger,
      'aria-controls': popupId
    }, elementProps, getButtonProps],
    stateAttributesMapping
  });

  // A fragment with key is required to ensure that the `element` is mounted to the same DOM node
  // regardless of whether the focus guards are rendered or not.
  const keyedElement = /*#__PURE__*/_jsx(React.Fragment, {
    children: element
  }, thisTriggerId);
  if (isMountedByThisTrigger && !focusManagerModal) {
    return /*#__PURE__*/_jsxs(React.Fragment, {
      children: [/*#__PURE__*/_jsx(FocusGuard, {
        ref: preFocusGuardRef,
        onFocus: handlePreFocusGuardFocus
      }), keyedElement, /*#__PURE__*/_jsx(FocusGuard, {
        ref: store.context.triggerFocusTargetRef,
        onFocus: handleFocusTargetFocus
      })]
    });
  }
  return keyedElement;
});
if (process.env.NODE_ENV !== "production") PopoverTrigger.displayName = "PopoverTrigger";