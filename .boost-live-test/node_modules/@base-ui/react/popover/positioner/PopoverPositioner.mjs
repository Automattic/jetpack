'use client';

import * as React from 'react';
import { inertValue } from '@base-ui/utils/inertValue';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { FloatingNode, useFloatingNodeId } from "../../floating-ui-react/index.mjs";
import { usePopoverRootContext } from "../root/PopoverRootContext.mjs";
import { PopoverPositionerContext } from "./PopoverPositionerContext.mjs";
import { useAnchorPositioning } from "../../internals/useAnchorPositioning.mjs";
import { usePopoverPortalContext } from "../portal/PopoverPortalContext.mjs";
import { InternalBackdrop } from "../../utils/InternalBackdrop.mjs";
import { REASONS } from "../../internals/reasons.mjs";
import { POPUP_COLLISION_AVOIDANCE } from "../../internals/constants.mjs";
import { useAnimationsFinished } from "../../internals/useAnimationsFinished.mjs";
import { usePositioner } from "../../utils/usePositioner.mjs";
import { useAnchoredPopupScrollLock } from "../../utils/useAnchoredPopupScrollLock.mjs";

/**
 * Positions the popover against the trigger.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
 */
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const PopoverPositioner = /*#__PURE__*/React.forwardRef(function PopoverPositioner(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    anchor,
    // `useAnchorPositioning` applies the same defaults to the undefined values; the names
    // remain destructured to exclude the props from `elementProps`.
    positionMethod,
    side,
    align,
    sideOffset,
    alignOffset,
    collisionBoundary = 'clipping-ancestors',
    collisionPadding,
    arrowPadding,
    sticky,
    disableAnchorTracking = false,
    collisionAvoidance = POPUP_COLLISION_AVOIDANCE,
    ...elementProps
  } = componentProps;
  const store = usePopoverRootContext();
  const keepMounted = usePopoverPortalContext();
  const nodeId = useFloatingNodeId();
  const floatingRootContext = store.useState('floatingRootContext');
  const mounted = store.useState('mounted');
  const open = store.useState('open');
  const openReason = store.useState('openChangeReason');
  const triggerElement = store.useState('activeTriggerElement');
  const modal = store.useState('modal');
  const openMethod = store.useState('openMethod');
  const positionerElement = store.useState('positionerElement');
  const instantType = store.useState('instantType');
  const transitionStatus = store.useState('transitionStatus');
  const adaptiveOrigin = store.useState('adaptiveOrigin');
  const prevTriggerElementRef = React.useRef(null);
  const runOnceAnimationsFinish = useAnimationsFinished(positionerElement);
  const positioning = useAnchorPositioning({
    anchor,
    floatingRootContext,
    positionMethod,
    mounted,
    side,
    sideOffset,
    align,
    alignOffset,
    arrowPadding,
    collisionBoundary,
    collisionPadding,
    sticky,
    disableAnchorTracking,
    keepMounted,
    nodeId,
    collisionAvoidance,
    adaptiveOrigin
  });
  const domReference = floatingRootContext.useState('domReferenceElement');

  // When the current trigger element changes, enable transitions on the
  // positioner temporarily
  useIsoLayoutEffect(() => {
    const currentTriggerElement = domReference;
    const prevTriggerElement = prevTriggerElementRef.current;
    if (currentTriggerElement) {
      prevTriggerElementRef.current = currentTriggerElement;
    }
    if (prevTriggerElement && currentTriggerElement && currentTriggerElement !== prevTriggerElement) {
      store.set('instantType', undefined);
      const ac = new AbortController();
      runOnceAnimationsFinish(() => {
        store.set('instantType', 'trigger-change');
      }, ac.signal);
      return () => {
        ac.abort();
      };
    }
    return undefined;
  }, [domReference, runOnceAnimationsFinish, store]);
  const trueModalNonHover = modal === true && openReason !== REASONS.triggerHover;
  useAnchoredPopupScrollLock(open && trueModalNonHover, openMethod === 'touch', positionerElement, triggerElement);
  const setPositionerElement = store.useStateSetter('positionerElement');
  const state = {
    open,
    side: positioning.side,
    align: positioning.align,
    anchorHidden: positioning.anchorHidden,
    instant: instantType
  };
  const element = usePositioner(componentProps, state, {
    styles: positioning.positionerStyles,
    transitionStatus,
    props: elementProps,
    refs: [forwardedRef, setPositionerElement],
    hidden: !mounted,
    inert: !open
  });
  return /*#__PURE__*/_jsxs(PopoverPositionerContext.Provider, {
    value: positioning,
    children: [mounted && trueModalNonHover && /*#__PURE__*/_jsx(InternalBackdrop, {
      inert: inertValue(!open),
      cutout: triggerElement
    }), /*#__PURE__*/_jsx(FloatingNode, {
      id: nodeId,
      children: element
    })]
  });
});
if (process.env.NODE_ENV !== "production") PopoverPositioner.displayName = "PopoverPositioner";