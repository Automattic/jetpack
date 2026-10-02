'use client';

import * as React from 'react';
import { useRenderElement } from "../../internals/useRenderElement.mjs";
import { useProgressRootContext } from "../root/ProgressRootContext.mjs";
import { progressStateAttributesMapping } from "../root/stateAttributesMapping.mjs";
/**
 * A text element displaying the current value.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Progress](https://base-ui.com/react/components/progress)
 */
export const ProgressValue = /*#__PURE__*/React.forwardRef(function ProgressValue(componentProps, forwardedRef) {
  const {
    className,
    render,
    children,
    style,
    ...elementProps
  } = componentProps;
  const {
    value,
    formattedValue,
    state
  } = useProgressRootContext();

  // Follow `status` rather than re-deriving it: a non-finite `value` is also indeterminate, and
  // has no formatted text to show.
  const indeterminate = state.status === 'indeterminate';
  const formattedValueArg = indeterminate ? 'indeterminate' : formattedValue;
  const formattedValueDisplay = indeterminate ? null : formattedValue;
  const element = useRenderElement('span', componentProps, {
    state,
    ref: forwardedRef,
    props: [{
      'aria-hidden': true,
      children: typeof children === 'function' ? children(formattedValueArg, value) : formattedValueDisplay
    }, elementProps],
    stateAttributesMapping: progressStateAttributesMapping
  });
  return element;
});
if (process.env.NODE_ENV !== "production") ProgressValue.displayName = "ProgressValue";