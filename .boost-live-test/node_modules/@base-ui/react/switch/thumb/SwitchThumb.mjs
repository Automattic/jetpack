'use client';

import * as React from 'react';
import { useSwitchRootContext } from "../root/SwitchRootContext.mjs";
import { useRenderElement } from "../../internals/useRenderElement.mjs";
import { stateAttributesMapping } from "../stateAttributesMapping.mjs";

/**
 * The movable part of the switch that indicates whether the switch is on or off.
 * Renders a `<span>`.
 *
 * Documentation: [Base UI Switch](https://base-ui.com/react/components/switch)
 */
export const SwitchThumb = /*#__PURE__*/React.forwardRef(function SwitchThumb(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    ...elementProps
  } = componentProps;
  const state = useSwitchRootContext();
  return useRenderElement('span', componentProps, {
    state,
    ref: forwardedRef,
    stateAttributesMapping,
    props: elementProps
  });
});
if (process.env.NODE_ENV !== "production") SwitchThumb.displayName = "SwitchThumb";