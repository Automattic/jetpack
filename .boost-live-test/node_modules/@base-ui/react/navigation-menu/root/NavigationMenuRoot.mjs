'use client';

import * as React from 'react';
import { isHTMLElement } from '@floating-ui/utils/dom';
import { useControlled } from '@base-ui/utils/useControlled';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { ownerDocument } from '@base-ui/utils/owner';
import { FloatingNode, FloatingTree, useFloatingNodeId, useFloatingParentNodeId } from "../../floating-ui-react/index.mjs";
import { activeElement, contains } from "../../floating-ui-react/utils.mjs";
import { useRenderElement } from "../../internals/useRenderElement.mjs";
import { NavigationMenuRootContext, NavigationMenuTreeContext, useNavigationMenuRootContext } from "./NavigationMenuRootContext.mjs";
import { useOpenChangeComplete } from "../../internals/useOpenChangeComplete.mjs";
import { useTransitionStatus } from "../../internals/useTransitionStatus.mjs";
import { REASONS } from "../../internals/reasons.mjs";
import * as NavigationMenuPositionerCssVars from "../positioner/NavigationMenuPositionerCssVars.mjs";
import { setSharedFixedSize } from "../utils/setSharedFixedSize.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
const blockedReturnFocusReasons = new Set([REASONS.triggerHover, REASONS.outsidePress, REASONS.focusOut]);
function getPositionerFixedSize(positionerElement) {
  // Read the last fixed positioner size rather than measuring the popup now:
  // during a controlled close, the popup can already be in its exit render and
  // report 0 before the closing transition gets a stable size to animate from.
  const width = parseFloat(positionerElement.style.getPropertyValue(NavigationMenuPositionerCssVars.positionerWidth)) || 0;
  const height = parseFloat(positionerElement.style.getPropertyValue(NavigationMenuPositionerCssVars.positionerHeight)) || 0;
  if (width <= 0 || height <= 0) {
    return null;
  }
  return {
    width,
    height
  };
}

/**
 * Groups all parts of the navigation menu.
 * Renders a `<nav>` element at the root, or `<div>` element when nested.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 */
export const NavigationMenuRoot = /*#__PURE__*/React.forwardRef(function NavigationMenuRoot(componentProps, forwardedRef) {
  const {
    defaultValue = null,
    value: valueParam,
    onValueChange,
    actionsRef,
    delay = 50,
    closeDelay = 50,
    orientation = 'horizontal',
    onOpenChangeComplete
  } = componentProps;
  const nested = useFloatingParentNodeId() != null;
  const parentRootContext = useNavigationMenuRootContext(true);
  const [value, setValueUnwrapped] = useControlled({
    controlled: valueParam,
    default: defaultValue,
    name: 'NavigationMenu',
    state: 'value'
  });

  // Derive open state from value being non-nullish
  const open = value != null;
  const closeReasonRef = React.useRef(undefined);
  const rootRef = React.useRef(null);
  const [positionerElement, setPositionerElement] = React.useState(null);
  const [popupElement, setPopupElement] = React.useState(null);
  const [viewportElement, setViewportElement] = React.useState(null);
  const [viewportTargetElement, setViewportTargetElement] = React.useState(null);
  const [activationDirection, setActivationDirection] = React.useState(null);
  const [floatingRootContext, setFloatingRootContext] = React.useState(undefined);
  const [viewportInert, setViewportInert] = React.useState(false);
  const prevTriggerElementRef = React.useRef(null);
  const currentContentRef = React.useRef(null);
  const beforeInsideRef = React.useRef(null);
  const afterInsideRef = React.useRef(null);
  const beforeOutsideRef = React.useRef(null);
  const afterOutsideRef = React.useRef(null);
  // Shared across triggers so a newly active trigger can cancel a stale
  // popup auto-size reset scheduled by the previously active trigger.
  const popupAutoSizeResetRef = React.useRef({
    abortController: null,
    owner: null
  });
  const {
    mounted,
    setMounted,
    transitionStatus
  } = useTransitionStatus(open);
  useIsoLayoutEffect(() => {
    if (open) {
      return;
    }
    if (!positionerElement || !popupElement) {
      return;
    }
    const closeTransitionSize = getPositionerFixedSize(positionerElement);
    if (!closeTransitionSize) {
      return;
    }

    // No cleanup is needed for this fixed size: if the popup unmounts, the inline
    // styles are removed with it. If it stays mounted, reopening runs the trigger's
    // sizing logic which clears these vars via `clearFixedSizes`/`setAutoSizes`.
    setSharedFixedSize(popupElement, positionerElement, closeTransitionSize.width, closeTransitionSize.height);
  }, [open, popupElement, positionerElement]);
  React.useEffect(() => {
    setViewportInert(false);
  }, [value]);
  const setValue = useStableCallback((nextValue, eventDetails) => {
    if (nextValue == null) {
      closeReasonRef.current = eventDetails.reason;
    }
    if (nextValue !== value) {
      onValueChange?.(nextValue, eventDetails);
    }
    if (eventDetails.isCanceled) {
      return;
    }
    if (nextValue == null) {
      setActivationDirection(null);
      setFloatingRootContext(undefined);
    }
    setValueUnwrapped(nextValue);
    if (nested && nextValue == null && eventDetails.reason === REASONS.linkPress && parentRootContext) {
      parentRootContext.setValue(null, eventDetails);
    }
  });
  const handleUnmount = useStableCallback(() => {
    const doc = ownerDocument(rootRef.current);
    const activeEl = activeElement(doc);
    const isReturnFocusBlocked = closeReasonRef.current ? blockedReturnFocusReasons.has(closeReasonRef.current) : false;
    if (!isReturnFocusBlocked && isHTMLElement(prevTriggerElementRef.current) && (activeEl === ownerDocument(popupElement).body || contains(popupElement, activeEl)) && popupElement) {
      prevTriggerElementRef.current.focus({
        preventScroll: true
      });
      prevTriggerElementRef.current = undefined;
    }
    setMounted(false);
    onOpenChangeComplete?.(false);
    setActivationDirection(null);
    setFloatingRootContext(undefined);
    currentContentRef.current = null;
    closeReasonRef.current = undefined;
  });

  // Providing `actionsRef` opts into manual unmounting, so close completion hooks leave it mounted.
  React.useImperativeHandle(actionsRef, () => ({
    unmount: handleUnmount
  }), [handleUnmount]);
  useOpenChangeComplete({
    enabled: !actionsRef,
    open,
    ref: {
      current: popupElement
    },
    onComplete() {
      if (!open) {
        handleUnmount();
      }
    }
  });
  useOpenChangeComplete({
    enabled: !actionsRef,
    open,
    ref: {
      current: viewportTargetElement
    },
    onComplete() {
      if (!open) {
        handleUnmount();
      }
    }
  });
  const contextActivationDirection = open ? activationDirection : null;
  const contextValue = React.useMemo(() => ({
    open,
    value,
    setValue,
    mounted,
    transitionStatus,
    positionerElement,
    setPositionerElement,
    popupElement,
    setPopupElement,
    viewportElement,
    setViewportElement,
    viewportTargetElement,
    setViewportTargetElement,
    activationDirection: contextActivationDirection,
    setActivationDirection,
    floatingRootContext,
    setFloatingRootContext,
    currentContentRef,
    nested,
    rootRef,
    beforeInsideRef,
    afterInsideRef,
    beforeOutsideRef,
    afterOutsideRef,
    prevTriggerElementRef,
    popupAutoSizeResetRef,
    delay,
    closeDelay,
    orientation,
    viewportInert,
    setViewportInert
  }), [open, value, setValue, mounted, transitionStatus, positionerElement, popupElement, viewportElement, viewportTargetElement, contextActivationDirection, floatingRootContext, nested, delay, closeDelay, orientation, viewportInert]);
  const jsx = /*#__PURE__*/_jsx(NavigationMenuRootContext.Provider, {
    value: contextValue,
    children: /*#__PURE__*/_jsx(TreeContext, {
      componentProps: componentProps,
      forwardedRef: forwardedRef,
      children: componentProps.children
    })
  });
  if (!nested) {
    // FloatingTree provides context to nested menus
    return /*#__PURE__*/_jsx(FloatingTree, {
      children: jsx
    });
  }
  return jsx;
});
if (process.env.NODE_ENV !== "production") NavigationMenuRoot.displayName = "NavigationMenuRoot";
function TreeContext(props) {
  const {
    className,
    render,
    defaultValue,
    value: valueParam,
    onValueChange,
    actionsRef,
    delay,
    closeDelay,
    orientation,
    onOpenChangeComplete,
    style,
    ...elementProps
  } = props.componentProps;
  const nodeId = useFloatingNodeId();
  const {
    rootRef,
    nested,
    open
  } = useNavigationMenuRootContext();
  const state = {
    open,
    nested
  };
  const element = useRenderElement(nested ? 'div' : 'nav', props.componentProps, {
    state,
    ref: [props.forwardedRef, rootRef],
    props: elementProps
  });
  return /*#__PURE__*/_jsx(NavigationMenuTreeContext.Provider, {
    value: nodeId,
    children: /*#__PURE__*/_jsx(FloatingNode, {
      id: nodeId,
      children: element
    })
  });
}