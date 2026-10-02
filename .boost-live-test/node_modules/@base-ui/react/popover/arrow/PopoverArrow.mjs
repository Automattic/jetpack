'use client';

import * as React from 'react';
import { usePopoverPositionerContext } from "../positioner/PopoverPositionerContext.mjs";
import { usePopoverRootContext } from "../root/PopoverRootContext.mjs";
import { popupStateMapping } from "../../utils/popupStateMapping.mjs";
import { useRenderElement } from "../../internals/useRenderElement.mjs";

/**
 * Displays an element positioned against the popover anchor.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
 */
export const PopoverArrow = /*#__PURE__*/React.forwardRef(function PopoverArrow(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    ...elementProps
  } = componentProps;
  const store = usePopoverRootContext();
  const open = store.useState('open');
  const {
    arrowRef,
    side,
    align,
    arrowUncentered,
    arrowStyles
  } = usePopoverPositionerContext();
  const state = {
    open,
    side,
    align,
    uncentered: arrowUncentered
  };
  const element = useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, arrowRef],
    props: [{
      style: arrowStyles,
      'aria-hidden': true
    }, elementProps],
    stateAttributesMapping: popupStateMapping
  });
  return element;
});
if (process.env.NODE_ENV !== "production") PopoverArrow.displayName = "PopoverArrow";