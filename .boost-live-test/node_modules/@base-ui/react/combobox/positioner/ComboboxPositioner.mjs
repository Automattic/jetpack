'use client';

import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { inertValue } from '@base-ui/utils/inertValue';
import { useComboboxFloatingContext, useComboboxRootContext } from "../root/ComboboxRootContext.mjs";
import { ComboboxPositionerContext } from "./ComboboxPositionerContext.mjs";
import { useListEmpty } from "../utils/parts.mjs";
import { useAnchorPositioning } from "../../internals/useAnchorPositioning.mjs";
import { useComboboxPortalContext } from "../portal/ComboboxPortalContext.mjs";
import { DROPDOWN_COLLISION_AVOIDANCE } from "../../internals/constants.mjs";
import { InternalBackdrop } from "../../utils/InternalBackdrop.mjs";
import { usePositioner } from "../../utils/usePositioner.mjs";
import { useAnchoredPopupScrollLock } from "../../utils/useAnchoredPopupScrollLock.mjs";

/**
 * Positions the popup against the trigger.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const ComboboxPositioner = /*#__PURE__*/React.forwardRef(function ComboboxPositioner(componentProps, forwardedRef) {
  const {
    render,
    className,
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
    collisionAvoidance = DROPDOWN_COLLISION_AVOIDANCE,
    style: styleProp,
    ...elementProps
  } = componentProps;
  const store = useComboboxRootContext();
  const floatingRootContext = useComboboxFloatingContext();
  const keepMounted = useComboboxPortalContext();
  const modal = store.useState('modal');
  const open = store.useState('open');
  const mounted = store.useState('mounted');
  const openMethod = store.useState('openMethod');
  const positionerElement = store.useState('positionerElement');
  const triggerElement = store.useState('triggerElement');
  const inputElement = store.useState('inputElement');
  const inputGroupElement = store.useState('inputGroupElement');
  const inputInsidePopup = store.useState('inputInsidePopup');
  const transitionStatus = store.useState('transitionStatus');
  const empty = useListEmpty();
  const resolvedAnchor = anchor ?? (inputInsidePopup ? triggerElement : inputGroupElement ?? inputElement);
  const positioning = useAnchorPositioning({
    anchor: resolvedAnchor,
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
    collisionAvoidance,
    lazyFlip: true
  });
  useAnchoredPopupScrollLock(open && modal, openMethod === 'touch', positionerElement, triggerElement);
  const state = {
    open,
    side: positioning.side,
    align: positioning.align,
    anchorHidden: positioning.anchorHidden,
    empty
  };
  useIsoLayoutEffect(() => {
    store.set('popupSide', positioning.side);
  }, [store, positioning.side]);
  const setPositionerElement = useStableCallback(element => {
    store.set('positionerElement', element);
  });
  const element = usePositioner(componentProps, state, {
    styles: positioning.positionerStyles,
    transitionStatus,
    props: elementProps,
    refs: [forwardedRef, setPositionerElement],
    hidden: !mounted,
    inert: !open
  });
  return /*#__PURE__*/_jsxs(ComboboxPositionerContext.Provider, {
    value: positioning,
    children: [mounted && modal && /*#__PURE__*/_jsx(InternalBackdrop, {
      inert: inertValue(!open),
      cutout: inputGroupElement ?? inputElement ?? triggerElement
    }), element]
  });
});
if (process.env.NODE_ENV !== "production") ComboboxPositioner.displayName = "ComboboxPositioner";