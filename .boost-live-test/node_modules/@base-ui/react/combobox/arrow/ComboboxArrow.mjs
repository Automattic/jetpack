'use client';

import * as React from 'react';
import { useComboboxPositionerContext } from "../positioner/ComboboxPositionerContext.mjs";
import { useComboboxRootContext } from "../root/ComboboxRootContext.mjs";
import { useRenderElement } from "../../internals/useRenderElement.mjs";
import { popupStateMapping } from "../../utils/popupStateMapping.mjs";

/**
 * Displays an element positioned against the anchor.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export const ComboboxArrow = /*#__PURE__*/React.forwardRef(function ComboboxArrow(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    ...elementProps
  } = componentProps;
  const store = useComboboxRootContext();
  const {
    arrowRef,
    side,
    align,
    arrowUncentered,
    arrowStyles
  } = useComboboxPositionerContext();
  const open = store.useState('open');
  const state = {
    open,
    side,
    align,
    uncentered: arrowUncentered
  };
  return useRenderElement('div', componentProps, {
    ref: [arrowRef, forwardedRef],
    stateAttributesMapping: popupStateMapping,
    state,
    props: {
      style: arrowStyles,
      'aria-hidden': true,
      ...elementProps
    }
  });
});
if (process.env.NODE_ENV !== "production") ComboboxArrow.displayName = "ComboboxArrow";