'use client';

import * as React from 'react';
import { useRenderElement } from "../../internals/useRenderElement.mjs";
import { useProgressRootContext } from "../root/ProgressRootContext.mjs";
import { progressStateAttributesMapping } from "../root/stateAttributesMapping.mjs";
/**
 * Visualizes the completion status of the task.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Progress](https://base-ui.com/react/components/progress)
 */
export const ProgressIndicator = /*#__PURE__*/React.forwardRef(function ProgressIndicator(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    ...elementProps
  } = componentProps;
  const {
    percentageValue,
    state
  } = useProgressRootContext();
  const indicatorStyle = percentageValue == null ? {} : {
    insetInlineStart: 0,
    height: 'inherit',
    width: `${percentageValue}%`
  };
  const element = useRenderElement('div', componentProps, {
    state,
    ref: forwardedRef,
    props: [{
      style: indicatorStyle
    }, elementProps],
    stateAttributesMapping: progressStateAttributesMapping
  });
  return element;
});
if (process.env.NODE_ENV !== "production") ProgressIndicator.displayName = "ProgressIndicator";