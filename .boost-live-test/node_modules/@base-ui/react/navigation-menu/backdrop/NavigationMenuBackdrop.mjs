'use client';

import * as React from 'react';
import { useRenderElement } from "../../internals/useRenderElement.mjs";
import { useNavigationMenuRootContext } from "../root/NavigationMenuRootContext.mjs";
import { popupTransitionStateMapping } from "../../utils/popupStateMapping.mjs";

/**
 * A backdrop for the navigation menu popup.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 */
export const NavigationMenuBackdrop = /*#__PURE__*/React.forwardRef(function NavigationMenuBackdrop(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    ...elementProps
  } = componentProps;
  const {
    open,
    mounted,
    transitionStatus
  } = useNavigationMenuRootContext();
  const state = {
    open,
    transitionStatus
  };
  const element = useRenderElement('div', componentProps, {
    state,
    ref: forwardedRef,
    props: [{
      role: 'presentation',
      hidden: !mounted,
      style: {
        userSelect: 'none',
        WebkitUserSelect: 'none'
      }
    }, elementProps],
    stateAttributesMapping: popupTransitionStateMapping
  });
  return element;
});
if (process.env.NODE_ENV !== "production") NavigationMenuBackdrop.displayName = "NavigationMenuBackdrop";