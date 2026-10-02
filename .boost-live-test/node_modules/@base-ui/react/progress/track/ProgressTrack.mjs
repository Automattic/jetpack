'use client';

import * as React from 'react';
import { useRenderElement } from "../../internals/useRenderElement.mjs";
import { useProgressRootContext } from "../root/ProgressRootContext.mjs";
import { progressStateAttributesMapping } from "../root/stateAttributesMapping.mjs";
/**
 * Contains the progress bar indicator.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Progress](https://base-ui.com/react/components/progress)
 */
export const ProgressTrack = /*#__PURE__*/React.forwardRef(function ProgressTrack(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    ...elementProps
  } = componentProps;
  const {
    state
  } = useProgressRootContext();
  const element = useRenderElement('div', componentProps, {
    state,
    ref: forwardedRef,
    props: elementProps,
    stateAttributesMapping: progressStateAttributesMapping
  });
  return element;
});
if (process.env.NODE_ENV !== "production") ProgressTrack.displayName = "ProgressTrack";