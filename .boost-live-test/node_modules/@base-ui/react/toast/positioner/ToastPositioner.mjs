'use client';

import * as React from 'react';
import { isElement } from '@floating-ui/utils/dom';
import { EMPTY_OBJECT } from '@base-ui/utils/empty';
import { useAnchorPositioning } from "../../internals/useAnchorPositioning.mjs";
import { POPUP_COLLISION_AVOIDANCE } from "../../internals/constants.mjs";
import { ToastPositionerContext } from "./ToastPositionerContext.mjs";
import { useFloatingRootContext } from "../../floating-ui-react/index.mjs";
import { NOOP } from "../../internals/noop.mjs";
import { useToastProviderContext } from "../provider/ToastProviderContext.mjs";
import { usePositioner } from "../../utils/usePositioner.mjs";
import * as ToastRootCssVars from "../root/ToastRootCssVars.mjs";

/**
 * Positions the toast against the anchor.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 */
import { jsx as _jsx } from "react/jsx-runtime";
export const ToastPositioner = /*#__PURE__*/React.forwardRef(function ToastPositioner(componentProps, forwardedRef) {
  const {
    toast,
    ...props
  } = componentProps;
  const store = useToastProviderContext();
  const positionerProps = toast.positionerProps ?? EMPTY_OBJECT;
  const {
    render,
    className,
    anchor: anchorProp = positionerProps.anchor,
    positionMethod = positionerProps.positionMethod ?? 'absolute',
    side = positionerProps.side ?? 'top',
    align = positionerProps.align ?? 'center',
    sideOffset = positionerProps.sideOffset ?? 0,
    alignOffset = positionerProps.alignOffset ?? 0,
    collisionBoundary = positionerProps.collisionBoundary ?? 'clipping-ancestors',
    collisionPadding = positionerProps.collisionPadding ?? 5,
    arrowPadding = positionerProps.arrowPadding ?? 5,
    sticky = positionerProps.sticky ?? false,
    disableAnchorTracking = positionerProps.disableAnchorTracking ?? false,
    collisionAvoidance = positionerProps.collisionAvoidance ?? POPUP_COLLISION_AVOIDANCE,
    style,
    ...elementProps
  } = props;
  const [positionerElement, setPositionerElement] = React.useState(null);
  const domIndex = store.useState('toastIndex', toast.id);
  const visibleIndex = store.useState('toastVisibleIndex', toast.id);
  const anchor = isElement(anchorProp) ? anchorProp : null;
  const floatingRootContext = useFloatingRootContext({
    open: true,
    onOpenChange: NOOP,
    elements: {
      floating: positionerElement,
      reference: anchor
    }
  });
  const positioning = useAnchorPositioning({
    anchor,
    positionMethod,
    floatingRootContext,
    mounted: true,
    side,
    sideOffset,
    align,
    alignOffset,
    collisionBoundary,
    collisionPadding,
    sticky,
    arrowPadding,
    disableAnchorTracking,
    keepMounted: true,
    collisionAvoidance
  });
  const state = {
    side: positioning.side,
    align: positioning.align,
    anchorHidden: positioning.anchorHidden
  };
  const element = usePositioner(componentProps, state, {
    styles: {
      ...positioning.positionerStyles,
      [ToastRootCssVars.index]: toast.transitionStatus === 'ending' ? domIndex : visibleIndex
    },
    transitionStatus: toast.transitionStatus,
    props: elementProps,
    refs: [forwardedRef, setPositionerElement]
  });
  return /*#__PURE__*/_jsx(ToastPositionerContext.Provider, {
    value: positioning,
    children: element
  });
});
if (process.env.NODE_ENV !== "production") ToastPositioner.displayName = "ToastPositioner";