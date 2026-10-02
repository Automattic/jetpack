'use client';

import * as React from 'react';
import { useMenuRootContext } from "../root/MenuRootContext.mjs";
import { useMenuPositionerContext } from "../positioner/MenuPositionerContext.mjs";
import { useRenderElement } from "../../internals/useRenderElement.mjs";
import { popupViewportStateMapping, usePopupViewport } from "../../utils/usePopupViewport.mjs";

/**
 * A viewport for displaying content transitions.
 * This component is only required if one popup can be opened by multiple triggers, its content
 * changes based on the trigger, and switching between them is animated.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export const MenuViewport = /*#__PURE__*/React.forwardRef(function MenuViewport(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    children,
    ...elementProps
  } = componentProps;
  const {
    store
  } = useMenuRootContext();
  const {
    side
  } = useMenuPositionerContext();
  const instantType = store.useState('instantType');
  const {
    children: childrenToRender,
    state: viewportState
  } = usePopupViewport({
    store,
    side,
    children
  });
  const state = {
    activationDirection: viewportState.activationDirection,
    transitioning: viewportState.transitioning,
    instant: instantType
  };
  return useRenderElement('div', componentProps, {
    state,
    ref: forwardedRef,
    props: [elementProps, {
      children: childrenToRender
    }],
    stateAttributesMapping: popupViewportStateMapping
  });
});
if (process.env.NODE_ENV !== "production") MenuViewport.displayName = "MenuViewport";