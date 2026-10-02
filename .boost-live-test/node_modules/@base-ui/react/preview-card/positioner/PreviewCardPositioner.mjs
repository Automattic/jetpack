'use client';

import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { usePreviewCardRootContext } from "../root/PreviewCardContext.mjs";
import { PreviewCardPositionerContext } from "./PreviewCardPositionerContext.mjs";
import { FloatingNode, useFloatingNodeId } from "../../floating-ui-react/index.mjs";
import { useAnchorPositioning } from "../../internals/useAnchorPositioning.mjs";
import { usePreviewCardPortalContext } from "../portal/PreviewCardPortalContext.mjs";
import { POPUP_COLLISION_AVOIDANCE } from "../../internals/constants.mjs";
import { usePositioner } from "../../utils/usePositioner.mjs";
import { createInlineMiddleware } from "../../utils/popups/index.mjs";

/**
 * Positions the popup against the trigger.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Preview Card](https://base-ui.com/react/components/preview-card)
 */
import { jsx as _jsx } from "react/jsx-runtime";
export const PreviewCardPositioner = /*#__PURE__*/React.forwardRef(function PreviewCardPositioner(componentProps, forwardedRef) {
  const {
    render,
    className,
    anchor,
    positionMethod = 'absolute',
    side = 'bottom',
    align = 'center',
    sideOffset = 0,
    alignOffset = 0,
    collisionBoundary = 'clipping-ancestors',
    collisionPadding = 5,
    arrowPadding = 5,
    sticky = false,
    disableAnchorTracking = false,
    collisionAvoidance = POPUP_COLLISION_AVOIDANCE,
    style,
    ...elementProps
  } = componentProps;
  const store = usePreviewCardRootContext();
  const keepMounted = usePreviewCardPortalContext();
  const nodeId = useFloatingNodeId();
  const open = store.useState('open');
  const mounted = store.useState('mounted');
  const floatingRootContext = store.useState('floatingRootContext');
  const instantType = store.useState('instantType');
  const transitionStatus = store.useState('transitionStatus');
  const adaptiveOrigin = store.useState('adaptiveOrigin');
  const inlineRectCoordsRef = store.context.inlineRectCoordsRef;
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
    adaptiveOrigin,
    inline: createInlineMiddleware(inlineRectCoordsRef)
  });
  const updatePosition = positioning.update;
  useIsoLayoutEffect(() => {
    if (open && mounted) {
      updatePosition();
    }
  }, [open, mounted, updatePosition]);
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
    refs: [forwardedRef, store.useStateSetter('positionerElement')],
    hidden: !mounted,
    inert: !open
  });
  return /*#__PURE__*/_jsx(PreviewCardPositionerContext.Provider, {
    value: positioning,
    children: /*#__PURE__*/_jsx(FloatingNode, {
      id: nodeId,
      children: element
    })
  });
});
if (process.env.NODE_ENV !== "production") PreviewCardPositioner.displayName = "PreviewCardPositioner";