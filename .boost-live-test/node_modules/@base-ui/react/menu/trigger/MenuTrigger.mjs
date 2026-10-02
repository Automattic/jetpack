'use client';

import _formatErrorMessage from "@base-ui/utils/formatErrorMessage";
import * as React from 'react';
import { useTimeout } from '@base-ui/utils/useTimeout';
import { ownerDocument } from '@base-ui/utils/owner';
import { fastComponentRef } from '@base-ui/utils/fastHooks';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { EMPTY_OBJECT } from '@base-ui/utils/empty';
import { safePolygon, useClick, useFloatingTree, useFocus, useHoverReferenceInteraction, useFloatingNodeId, useFloatingParentNodeId } from "../../floating-ui-react/index.mjs";
import { FloatingTreeStore } from "../../floating-ui-react/components/FloatingTreeStore.mjs";
import { contains } from "../../floating-ui-react/utils.mjs";
import { useMenuRootContext } from "../root/MenuRootContext.mjs";
import { pressableTriggerOpenStateMapping } from "../../utils/popupStateMapping.mjs";
import { useRenderElement } from "../../internals/useRenderElement.mjs";
import { useButton } from "../../internals/use-button/useButton.mjs";
import { isMouseWithinBounds } from "../../utils/getPseudoElementBounds.mjs";
import { CompositeItem } from "../../internals/composite/item/CompositeItem.mjs";
import { useCompositeRootContext } from "../../internals/composite/root/CompositeRootContext.mjs";
import { findRootOwnerId } from "../utils/findRootOwnerId.mjs";
import { usePopupHandleStore, useTriggerDataForwarding } from "../../utils/popups/index.mjs";
import { useTriggerFocusGuards } from "../../utils/popups/useTriggerFocusGuards.mjs";
import { useBaseUiId } from "../../internals/useBaseUiId.mjs";
import { REASONS } from "../../internals/reasons.mjs";
import { useMixedToggleClickHandler } from "../../utils/useMixedToggleClickHandler.mjs";
import { useMenubarContext } from "../../menubar/MenubarContext.mjs";
import { PATIENT_CLICK_THRESHOLD } from "../../internals/constants.mjs";
import { FocusGuard } from "../../utils/FocusGuard.mjs";
import { mergeProps } from "../../merge-props/index.mjs";

/**
 * A button that opens the menu.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const MenuTrigger = fastComponentRef(function MenuTrigger(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    disabled: disabledProp = false,
    nativeButton = true,
    id: idProp,
    openOnHover: openOnHoverProp,
    delay = 100,
    closeDelay = 0,
    handle,
    payload,
    ...elementProps
  } = componentProps;
  const rootContext = useMenuRootContext(true);
  const handleStore = usePopupHandleStore(handle);
  const store = handleStore ?? rootContext?.store;
  if (!store) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: <Menu.Trigger> must be either used within a <Menu.Root> component or provided with a handle.' : _formatErrorMessage(85));
  }
  const thisTriggerId = useBaseUiId(idProp);
  const isTriggerActive = store.useState('isTriggerActive', thisTriggerId);
  const floatingRootContext = store.useState('floatingRootContext');
  const isOpenedByThisTrigger = store.useState('isOpenedByTrigger', thisTriggerId);
  const popupId = store.useState('triggerPopupId', thisTriggerId);
  const triggerElementRef = React.useRef(null);
  const parent = useMenuParent();
  const compositeRootContext = useCompositeRootContext(true);
  const floatingTreeRootFromContext = useFloatingTree();
  const floatingTreeRoot = React.useMemo(() => {
    return floatingTreeRootFromContext ?? new FloatingTreeStore();
  }, [floatingTreeRootFromContext]);
  const floatingNodeId = useFloatingNodeId(floatingTreeRoot);
  const floatingParentNodeId = useFloatingParentNodeId();
  const {
    registerTrigger,
    isMountedByThisTrigger
  } = useTriggerDataForwarding(thisTriggerId, triggerElementRef, store, {
    payload,
    closeDelay,
    parent,
    floatingTreeRoot,
    floatingNodeId,
    floatingParentNodeId,
    keyboardEventRelay: compositeRootContext?.relayKeyboardEvent
  });
  const isInMenubar = parent.type === 'menubar';
  const rootDisabled = store.useState('disabled');
  const disabled = disabledProp || rootDisabled || isInMenubar && parent.context.disabled;
  const {
    getButtonProps,
    buttonRef
  } = useButton({
    disabled,
    native: nativeButton
  });
  React.useEffect(() => {
    if (!isOpenedByThisTrigger && parent.type === undefined) {
      store.context.allowMouseUpTriggerRef.current = false;
    }
  }, [store, isOpenedByThisTrigger, parent.type]);
  const triggerRef = React.useRef(null);
  const allowMouseUpTriggerTimeout = useTimeout();
  const handleDocumentMouseUp = useStableCallback(mouseEvent => {
    if (!triggerRef.current) {
      return;
    }
    allowMouseUpTriggerTimeout.clear();
    store.context.allowMouseUpTriggerRef.current = false;
    const mouseUpTarget = mouseEvent.target;
    if (contains(triggerRef.current, mouseUpTarget) || contains(store.select('positionerElement'), mouseUpTarget) || mouseUpTarget === triggerRef.current) {
      return;
    }
    if (mouseUpTarget != null && findRootOwnerId(mouseUpTarget) === store.select('rootId')) {
      return;
    }
    if (isMouseWithinBounds(mouseEvent, triggerRef.current)) {
      return;
    }
    floatingTreeRoot.events.emit('close', {
      domEvent: mouseEvent,
      reason: REASONS.cancelOpen
    });
  });
  React.useEffect(() => {
    if (isOpenedByThisTrigger && store.select('lastOpenChangeReason') === REASONS.triggerHover) {
      const doc = ownerDocument(triggerRef.current);
      doc.addEventListener('mouseup', handleDocumentMouseUp, {
        once: true
      });
    }
  }, [isOpenedByThisTrigger, handleDocumentMouseUp, store]);
  const parentMenubarHasSubmenuOpen = isInMenubar && parent.context.hasSubmenuOpen;
  const openOnHover = openOnHoverProp ?? parentMenubarHasSubmenuOpen;
  const hoverProps = useHoverReferenceInteraction(floatingRootContext, {
    enabled: openOnHover && !disabled && (!isInMenubar || parentMenubarHasSubmenuOpen && !isMountedByThisTrigger),
    handleClose: safePolygon({
      blockPointerEvents: !isInMenubar
    }),
    mouseOnly: true,
    move: false,
    restMs: parent.type === undefined ? delay : undefined,
    delay: {
      close: closeDelay
    },
    triggerElementRef,
    externalTree: floatingTreeRoot,
    isActiveTrigger: isTriggerActive,
    isClosing: () => store.select('transitionStatus') === 'ending'
  });

  // Whether to ignore clicks to open the menu.
  // `lastOpenChangeReason` doesn't need to be reactive here, as we need to run this
  // only when `isOpenedByThisTrigger` changes.
  const stickIfOpen = useStickIfOpen(isOpenedByThisTrigger, store.select('lastOpenChangeReason'));
  const click = useClick(floatingRootContext, {
    enabled: !disabled,
    event: isOpenedByThisTrigger && isInMenubar ? 'click' : 'mousedown',
    toggle: true,
    ignoreMouse: false,
    stickIfOpen: parent.type === undefined ? stickIfOpen : false
  });
  const focus = useFocus(floatingRootContext, {
    enabled: !disabled && parentMenubarHasSubmenuOpen
  });
  const mixedToggleHandlers = useMixedToggleClickHandler({
    open: isOpenedByThisTrigger,
    enabled: isInMenubar,
    mouseDownAction: 'open'
  });
  const localInteractionProps = React.useMemo(() => mergeProps(focus.reference, click.reference), [focus.reference, click.reference]);
  const rootTriggerProps = store.useState('triggerProps', isMountedByThisTrigger);
  const {
    preFocusGuardRef,
    handlePreFocusGuardFocus,
    handleFocusTargetFocus
  } = useTriggerFocusGuards(store, triggerElementRef);
  const state = {
    disabled,
    open: isOpenedByThisTrigger
  };
  const ref = [triggerRef, forwardedRef, buttonRef, registerTrigger, triggerElementRef];
  const props = [localInteractionProps, hoverProps ?? EMPTY_OBJECT, rootTriggerProps, {
    'aria-haspopup': 'menu',
    'aria-controls': popupId,
    id: thisTriggerId,
    onMouseDown: event => {
      if (store.select('open')) {
        return;
      }

      // mousedown -> mouseup on menu item should not trigger it within 200ms.
      allowMouseUpTriggerTimeout.start(200, () => {
        store.context.allowMouseUpTriggerRef.current = true;
      });
      const doc = ownerDocument(event.currentTarget);
      doc.addEventListener('mouseup', handleDocumentMouseUp, {
        once: true
      });
    }
  }, isInMenubar ? {
    role: 'menuitem'
  } : {}, mixedToggleHandlers, elementProps, getButtonProps];
  const element = useRenderElement('button', componentProps, {
    enabled: !isInMenubar,
    stateAttributesMapping: pressableTriggerOpenStateMapping,
    state,
    ref,
    props
  });
  if (isInMenubar) {
    return /*#__PURE__*/_jsx(CompositeItem, {
      tag: "button",
      render: render,
      className: className,
      style: style,
      state: state,
      refs: ref,
      props: props,
      stateAttributesMapping: pressableTriggerOpenStateMapping
    });
  }

  // A fragment with key is required to ensure that the `element` is mounted to the same DOM node
  // regardless of whether the focus guards are rendered or not.

  if (isOpenedByThisTrigger) {
    return /*#__PURE__*/_jsxs(React.Fragment, {
      children: [/*#__PURE__*/_jsx(FocusGuard, {
        ref: preFocusGuardRef,
        onFocus: handlePreFocusGuardFocus
      }, `${thisTriggerId}-pre-focus-guard`), /*#__PURE__*/_jsx(React.Fragment, {
        children: element
      }, thisTriggerId), /*#__PURE__*/_jsx(FocusGuard, {
        ref: store.context.triggerFocusTargetRef,
        onFocus: handleFocusTargetFocus
      }, `${thisTriggerId}-post-focus-guard`)]
    });
  }
  return /*#__PURE__*/_jsx(React.Fragment, {
    children: element
  }, thisTriggerId);
});
if (process.env.NODE_ENV !== "production") MenuTrigger.displayName = "MenuTrigger";
/**
 * Determines whether to ignore clicks after a hover-open.
 */
function useStickIfOpen(open, openReason) {
  const stickIfOpenTimeout = useTimeout();
  const [stickIfOpen, setStickIfOpen] = React.useState(false);
  useIsoLayoutEffect(() => {
    if (open && openReason === REASONS.triggerHover) {
      // Only allow "patient" clicks to close the menu if it's open.
      // If they clicked within 500ms of the menu opening, keep it open.
      setStickIfOpen(true);
      stickIfOpenTimeout.start(PATIENT_CLICK_THRESHOLD, () => {
        setStickIfOpen(false);
      });
    } else if (!open) {
      stickIfOpenTimeout.clear();
      setStickIfOpen(false);
    }
  }, [open, openReason, stickIfOpenTimeout]);
  return stickIfOpen;
}
function useMenuParent() {
  const menubarContext = useMenubarContext(true);
  const parent = React.useMemo(() => {
    if (menubarContext) {
      return {
        type: 'menubar',
        context: menubarContext
      };
    }
    return {
      type: undefined
    };
  }, [menubarContext]);
  return parent;
}