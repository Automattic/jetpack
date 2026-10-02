'use client';

import * as React from 'react';
import { useRenderElement } from "../../internals/useRenderElement.mjs";
import { useNavigationMenuRootContext } from "../root/NavigationMenuRootContext.mjs";
import { triggerOpenStateMapping } from "../../utils/popupStateMapping.mjs";
import { useNavigationMenuItemContext } from "../item/NavigationMenuItemContext.mjs";

/**
 * An icon that indicates that the trigger button opens a menu.
 *
 * Documentation: [Base UI Navigation Menu](https://base-ui.com/react/components/navigation-menu)
 */
export const NavigationMenuIcon = /*#__PURE__*/React.forwardRef(function NavigationMenuIcon(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    ...elementProps
  } = componentProps;
  const {
    value: itemValue
  } = useNavigationMenuItemContext();
  const {
    open,
    value
  } = useNavigationMenuRootContext();
  const isActiveItem = open && value === itemValue;
  const state = {
    open: isActiveItem
  };
  const element = useRenderElement('span', componentProps, {
    state,
    ref: forwardedRef,
    props: [{
      'aria-hidden': true,
      children: '▼'
    }, elementProps],
    stateAttributesMapping: triggerOpenStateMapping
  });
  return element;
});
if (process.env.NODE_ENV !== "production") NavigationMenuIcon.displayName = "NavigationMenuIcon";