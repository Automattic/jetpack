'use client';

import * as React from 'react';
import { usePopoverRootContext } from "../root/PopoverRootContext.mjs";
import { popupTransitionStateMapping } from "../../utils/popupStateMapping.mjs";
import { useRenderElement } from "../../internals/useRenderElement.mjs";
import { REASONS } from "../../internals/reasons.mjs";

/**
 * An overlay displayed beneath the popover.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
 */
export const PopoverBackdrop = /*#__PURE__*/React.forwardRef(function PopoverBackdrop(props, forwardedRef) {
  const {
    render,
    className,
    style,
    ...elementProps
  } = props;
  const store = usePopoverRootContext();
  const open = store.useState('open');
  const mounted = store.useState('mounted');
  const transitionStatus = store.useState('transitionStatus');
  const openReason = store.useState('openChangeReason');
  const state = {
    open,
    transitionStatus
  };
  const element = useRenderElement('div', props, {
    state,
    ref: forwardedRef,
    props: [{
      role: 'presentation',
      hidden: !mounted,
      style: {
        pointerEvents: openReason === REASONS.triggerHover ? 'none' : undefined,
        userSelect: 'none',
        WebkitUserSelect: 'none'
      }
    }, elementProps],
    stateAttributesMapping: popupTransitionStateMapping
  });
  return element;
});
if (process.env.NODE_ENV !== "production") PopoverBackdrop.displayName = "PopoverBackdrop";