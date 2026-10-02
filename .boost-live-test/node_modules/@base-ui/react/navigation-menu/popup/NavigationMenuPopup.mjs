'use client';

import * as React from 'react';
import { useRenderElement } from "../../internals/useRenderElement.mjs";
import { useNavigationMenuRootContext } from "../root/NavigationMenuRootContext.mjs";
import { useBaseUiId } from "../../internals/useBaseUiId.mjs";
import { useNavigationMenuPositionerContext } from "../positioner/NavigationMenuPositionerContext.mjs";
import { useDirection } from "../../internals/direction-context/DirectionContext.mjs";
import { popupTransitionStateMapping } from "../../utils/popupStateMapping.mjs";
import { getDisabledMountTransitionStyles } from "../../internals/getDisabledMountTransitionStyles.mjs";

/**
 * A container for the navigation menu contents.
 * Renders a `<nav>` element.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 */
export const NavigationMenuPopup = /*#__PURE__*/React.forwardRef(function NavigationMenuPopup(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    id: idProp,
    ...elementProps
  } = componentProps;
  const {
    open,
    transitionStatus,
    setPopupElement
  } = useNavigationMenuRootContext();
  const positioning = useNavigationMenuPositionerContext();
  const direction = useDirection();
  const id = useBaseUiId(idProp);
  const state = {
    open,
    transitionStatus,
    side: positioning.side,
    align: positioning.align,
    anchorHidden: positioning.anchorHidden
  };

  // Ensure popup size transitions correctly when anchored to `bottom` (side=top) or `right` (side=left).
  let isPhysicalLeft = positioning.side === 'left';
  if (direction === 'rtl') {
    isPhysicalLeft = isPhysicalLeft || positioning.side === 'inline-end';
  } else {
    isPhysicalLeft = isPhysicalLeft || positioning.side === 'inline-start';
  }
  const isOriginSide = positioning.side === 'top' || isPhysicalLeft;
  const element = useRenderElement('nav', componentProps, {
    state,
    ref: [forwardedRef, setPopupElement],
    props: [{
      id,
      tabIndex: -1,
      style: isOriginSide ? {
        position: 'absolute',
        [positioning.side === 'top' ? 'bottom' : 'top']: '0',
        [isPhysicalLeft ? 'right' : 'left']: '0'
      } : {}
    }, getDisabledMountTransitionStyles(transitionStatus), elementProps],
    stateAttributesMapping: popupTransitionStateMapping
  });
  return element;
});
if (process.env.NODE_ENV !== "production") NavigationMenuPopup.displayName = "NavigationMenuPopup";