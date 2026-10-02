'use client';

import * as React from 'react';
import { usePreviewCardRootContext } from "../root/PreviewCardContext.mjs";
import { usePreviewCardPositionerContext } from "../positioner/PreviewCardPositionerContext.mjs";
import { useRenderElement } from "../../internals/useRenderElement.mjs";
import { popupViewportStateMapping, usePopupViewport } from "../../utils/usePopupViewport.mjs";

/**
 * A viewport for displaying content transitions.
 * This component is only required if one popup can be opened by multiple triggers, its content
 * changes based on the trigger, and switching between them is animated.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Preview Card](https://base-ui.com/react/components/preview-card)
 */
export const PreviewCardViewport = /*#__PURE__*/React.forwardRef(function PreviewCardViewport(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    children,
    ...elementProps
  } = componentProps;
  const store = usePreviewCardRootContext();
  const positioner = usePreviewCardPositionerContext();
  const instantType = store.useState('instantType');
  const {
    children: childrenToRender,
    state: viewportState
  } = usePopupViewport({
    store,
    side: positioner.side,
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
if (process.env.NODE_ENV !== "production") PreviewCardViewport.displayName = "PreviewCardViewport";